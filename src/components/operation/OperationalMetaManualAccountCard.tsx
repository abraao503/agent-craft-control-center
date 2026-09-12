import { type ReactNode, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Webhook,
} from "lucide-react";
import { useOperationalMetaManualAccountMutations, useOperationalMetaManualAccounts } from "@/hooks/useOperationalMetaManualAccounts";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import type {
  ConfigureOperationalMetaWebhookData,
  OperationalMetaManualAccount,
  SaveOperationalMetaManualAccountBody,
} from "@/types/operation-meta-manual-account";
import {
  formatOperationalDateTime,
  getOperationalErrorCode,
  getOperationalErrorMessage,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const manualAccountFormSchema = z.object({
  wabaId: z.string().trim().min(1, "Informe o WABA ID").max(100),
  appId: z.string().trim().min(1, "Informe o App ID").max(100),
  appSecret: z.string().trim().min(1, "Informe o App Secret").max(512),
  accessToken: z
    .string()
    .trim()
    .min(1, "Informe o token de acesso")
    .max(4096),
});

type ManualAccountFormValues = z.infer<typeof manualAccountFormSchema>;

type ManualAccountDialogState =
  | {
      step: "credentials";
      account: OperationalMetaManualAccount | null;
    }
  | {
      step: "webhook";
      account: OperationalMetaManualAccount;
    };

type WebhookSetup = ConfigureOperationalMetaWebhookData;

const EMPTY_FORM_VALUES: ManualAccountFormValues = {
  wabaId: "",
  appId: "",
  appSecret: "",
  accessToken: "",
};

export function OperationalMetaManualAccountCard({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { has, isCompanyLevel } = usePermissions();
  const { toast } = useToast();
  const accountsQuery = useOperationalMetaManualAccounts(workspaceId);
  const mutations = useOperationalMetaManualAccountMutations(workspaceId);
  const [dialog, setDialog] = useState<ManualAccountDialogState | null>(null);
  const [webhookSetups, setWebhookSetups] = useState<
    Record<string, WebhookSetup>
  >({});
  const [webhookErrors, setWebhookErrors] = useState<Record<string, string>>(
    {},
  );
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const form = useForm<ManualAccountFormValues>({
    resolver: zodResolver(manualAccountFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const isCompanyAdmin = isCompanyLevel();
  const canManageManualAccount =
    isCompanyAdmin &&
    has("manage:integrations") &&
    has("manage:operation-channels");
  const accounts = accountsQuery.data ?? [];
  const dialogAccount =
    dialog?.step === "webhook"
      ? accounts.find((account) => account.wabaId === dialog.account.wabaId) ??
        dialog.account
      : null;
  const activeWebhookSetup = dialogAccount
    ? webhookSetups[dialogAccount.wabaId]
    : undefined;
  const isSaving = mutations.save.isPending;
  const isGeneratingWebhook = mutations.configureWebhook.isPending;

  const openCredentialsDialog = (account: OperationalMetaManualAccount | null) => {
    form.reset({
      wabaId: account?.wabaId ?? "",
      appId: "",
      appSecret: "",
      accessToken: "",
    });
    setDialog({ step: "credentials", account });
  };

  const openWebhookDialog = (account: OperationalMetaManualAccount) => {
    setWebhookSetups((current) => {
      const next = { ...current };
      delete next[account.wabaId];
      return next;
    });
    setWebhookErrors((current) => {
      const next = { ...current };
      delete next[account.wabaId];
      return next;
    });
    setShowVerifyToken(false);
    setCopiedTarget(null);
    setDialog({ step: "webhook", account });
  };

  const closeDialog = () => {
    if (isSaving || isGeneratingWebhook) return;

    const webhookWabaId =
      dialog?.step === "webhook" ? dialog.account.wabaId : undefined;
    if (webhookWabaId) {
      setWebhookSetups((current) => {
        const next = { ...current };
        delete next[webhookWabaId];
        return next;
      });
    }
    form.reset(EMPTY_FORM_VALUES);
    setShowVerifyToken(false);
    setCopiedTarget(null);
    setDialog(null);
  };

  const generateWebhook = async (account: OperationalMetaManualAccount) => {
    setWebhookErrors((current) => {
      const next = { ...current };
      delete next[account.wabaId];
      return next;
    });

    try {
      const setup = await mutations.configureWebhook.mutateAsync({
        wabaId: account.wabaId,
      });
      setWebhookSetups((current) => ({
        ...current,
        [account.wabaId]: setup,
      }));
      setShowVerifyToken(false);
      toast({
        title: "Instruções do webhook geradas",
        description:
          "Copie a callback URL e o token para concluir a configuração no app da Meta.",
      });
    } catch (error) {
      const message = getOperationalErrorMessage(
        error,
        "Não foi possível gerar as instruções do webhook. Tente novamente.",
      );
      setWebhookErrors((current) => ({
        ...current,
        [account.wabaId]: message,
      }));
      toast({
        title: "Webhook não configurado",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSave = form.handleSubmit(async (values) => {
    if (!dialog || dialog.step !== "credentials") return;

    const editingAccount = dialog.account;
    try {
      const savedAccount = await mutations.save.mutateAsync({
        wabaId: values.wabaId.trim(),
        body: buildManualAccountBody(values),
      });

      form.reset(EMPTY_FORM_VALUES);
      toast({
        title: editingAccount
          ? "Conta Meta atualizada"
          : "Conta Meta validada",
        description: editingAccount
          ? "Os dados foram validados novamente. Nenhum segredo salvo foi exibido."
          : "Agora configure o webhook para receber mensagens deste número.",
      });

      if (!editingAccount) {
        setDialog({ step: "webhook", account: savedAccount });
        await generateWebhook(savedAccount);
      } else {
        closeDialog();
      }
    } catch (error) {
      const message = getManualAccountErrorMessage(error);
      form.setError("root", { message });
      toast({
        title: "Não foi possível validar a conta Meta",
        description: message,
        variant: "destructive",
      });
    }
  });

  const handleCopy = async (target: string, value: string) => {
    try {
      if (!navigator.clipboard) throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      window.setTimeout(() => {
        setCopiedTarget((current) => (current === target ? null : current));
      }, 1800);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione o valor e copie manualmente.",
        variant: "destructive",
      });
    }
  };

  const refreshWebhookStatus = async () => {
    if (!dialogAccount) return;

    const result = await accountsQuery.refetch();
    const updatedAccount = result.data?.find(
      (account) => account.wabaId === dialogAccount.wabaId,
    );
    if (updatedAccount?.webhookConfigured) {
      toast({
        title: "Webhook verificado",
        description: "A Meta confirmou a callback desta conta.",
      });
      return;
    }

    toast({
      title: "Verificação ainda pendente",
      description:
        "Conclua o cadastro no app da Meta e atualize o status novamente.",
    });
  };

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Conta Meta Cloud da empresa
          </CardTitle>
          <CardDescription className="max-w-2xl leading-5">
            Configure a conta Meta uma vez. Depois, os ambientes operacionais
            podem usar os números sincronizados sem repetir credenciais.
          </CardDescription>
        </div>
        {canManageManualAccount ? (
          <Button onClick={() => openCredentialsDialog(null)}>
            <KeyRound className="h-4 w-4" />
            Configurar conta
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {accountsQuery.isLoading ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg border bg-muted/20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando contas Meta</span>
          </div>
        ) : accountsQuery.isError ? (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar a conta Meta</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Verifique sua permissão ou tente novamente.
              <Button
                size="sm"
                variant="outline"
                onClick={() => void accountsQuery.refetch()}
                disabled={accountsQuery.isFetching}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : !accounts.length ? (
          <div className="rounded-lg border border-dashed bg-muted/10 p-5">
            <p className="font-medium">
              {canManageManualAccount
                ? "Nenhuma conta Meta configurada"
                : "A conta Meta ainda não foi configurada pela empresa"}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              {canManageManualAccount
                ? "Informe os dados do app da Meta para validar a conta e liberar seus números para os canais."
                : "Peça ao administrador da empresa para concluir a configuração. O administrador do workspace não precisa informar credenciais."}
            </p>
            {canManageManualAccount ? (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => openCredentialsDialog(null)}
              >
                <KeyRound className="h-4 w-4" />
                Começar configuração
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <ManualAccountRow
                key={account.id}
                account={account}
                canManage={canManageManualAccount}
                webhookSetup={webhookSetups[account.wabaId]}
                isWebhookPending={
                  isGeneratingWebhook &&
                  dialog?.step === "webhook" &&
                  dialog.account.wabaId === account.wabaId
                }
                onEdit={() => openCredentialsDialog(account)}
                onConfigureWebhook={() => openWebhookDialog(account)}
              />
            ))}
          </div>
        )}

        {!canManageManualAccount && accounts.length > 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
            <p className="font-medium">Configuração feita pela empresa</p>
            <p className="mt-1 text-blue-900/80 dark:text-blue-100/80">
              Você pode selecionar números livres ao criar uma conexão neste
              workspace. Os dados sensíveis ficam restritos aos administradores
              da empresa.
            </p>
          </div>
        ) : null}
      </CardContent>

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        {dialog?.step === "credentials" ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {dialog.account
                  ? "Atualizar conta Meta da empresa"
                  : "Configurar conta Meta da empresa"}
              </DialogTitle>
              <DialogDescription>
                A Meta será consultada antes de salvar. Os segredos ficam
                criptografados e nunca retornam para a tela depois da gravação.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="operational-meta-manual-waba-id">WABA ID</Label>
                <Input
                  id="operational-meta-manual-waba-id"
                  placeholder="Ex.: 1029384756"
                  disabled={Boolean(dialog.account) || isSaving}
                  autoComplete="off"
                  {...form.register("wabaId")}
                />
                <p className="text-xs text-muted-foreground">
                  É o ID da conta do WhatsApp Business que pertence à empresa.
                </p>
                <FieldError message={form.formState.errors.wabaId?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="operational-meta-manual-app-id"
                  label="App ID"
                  placeholder="ID do app Meta"
                  disabled={isSaving}
                  registration={form.register("appId")}
                  error={form.formState.errors.appId?.message}
                />
                <SecretFormField
                  id="operational-meta-manual-app-secret"
                  label="App Secret"
                  placeholder="Secret do app Meta"
                  disabled={isSaving}
                  registration={form.register("appSecret")}
                  error={form.formState.errors.appSecret?.message}
                />
              </div>

              <SecretFormField
                id="operational-meta-manual-access-token"
                label="Token de acesso"
                placeholder="Token com permissões do WhatsApp Business"
                disabled={isSaving}
                registration={form.register("accessToken")}
                error={form.formState.errors.accessToken?.message}
              />

              {dialog.account ? (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Segredos não são recuperáveis</AlertTitle>
                  <AlertDescription>
                    Para substituir a configuração, informe novamente os três
                    valores. O formulário nunca preenche credenciais salvas.
                  </AlertDescription>
                </Alert>
              ) : null}
              <FieldError message={form.formState.errors.root?.message} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isSaving ? "Validando..." : "Validar e salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}

        {dialog?.step === "webhook" && dialogAccount ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[660px]">
            <DialogHeader>
              <DialogTitle>Concluir configuração da Meta</DialogTitle>
              <DialogDescription>
                A conta foi validada. Cadastre a callback URL e o token no app
                da Meta para liberar o recebimento de mensagens.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-950 dark:text-emerald-100">
                      Credenciais validadas
                    </p>
                    <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                      WABA {dialogAccount.wabaId} · {dialogAccount.phoneNumbers.length} {dialogAccount.phoneNumbers.length === 1 ? "número sincronizado" : "números sincronizados"}
                    </p>
                  </div>
                </div>
              </div>

              {activeWebhookSetup ? (
                <WebhookInstructions
                  account={dialogAccount}
                  setup={activeWebhookSetup}
                  showVerifyToken={showVerifyToken}
                  copiedTarget={copiedTarget}
                  isRefreshing={accountsQuery.isFetching}
                  onCopy={handleCopy}
                  onToggleToken={() => setShowVerifyToken((visible) => !visible)}
                  onRefresh={() => void refreshWebhookStatus()}
                />
              ) : (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Webhook className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Gerar dados do webhook</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        A URL e o token são gerados pela API e o token só será
                        mostrado nesta etapa.
                      </p>
                    </div>
                  </div>
                  {webhookErrors[dialogAccount.wabaId] ? (
                    <Alert variant="destructive">
                      <TriangleAlert className="h-4 w-4" />
                      <AlertTitle>Não foi possível configurar o webhook</AlertTitle>
                      <AlertDescription>
                        {webhookErrors[dialogAccount.wabaId]}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void generateWebhook(dialogAccount)}
                    disabled={isGeneratingWebhook}
                  >
                    {isGeneratingWebhook ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Webhook className="h-4 w-4" />
                    )}
                    {isGeneratingWebhook
                      ? "Gerando..."
                      : "Gerar callback e token"}
                  </Button>
                </div>
              )}

              {dialogAccount.webhookConfigured ? (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-emerald-950 dark:text-emerald-100">
                    Webhook verificado
                    {dialogAccount.webhookVerifiedAt
                      ? ` em ${formatOperationalDateTime(dialogAccount.webhookVerifiedAt)}.`
                      : "."}
                  </p>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isGeneratingWebhook}
              >
                Concluir depois
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </Card>
  );
}

function ManualAccountRow({
  account,
  canManage,
  webhookSetup,
  isWebhookPending,
  onEdit,
  onConfigureWebhook,
}: {
  account: OperationalMetaManualAccount;
  canManage: boolean;
  webhookSetup?: WebhookSetup;
  isWebhookPending: boolean;
  onEdit: () => void;
  onConfigureWebhook: () => void;
}) {
  const needsAttention = ["ERROR", "NEEDS_REAUTHORIZATION"].includes(
    account.status,
  );
  const validationLabel = needsAttention
    ? account.status === "NEEDS_REAUTHORIZATION"
      ? "Reautorização necessária"
      : "Validação com problema"
    : account.lastValidatedAt
      ? "Credenciais validadas"
      : "Validação pendente";
  const webhookLabel = account.webhookConfigured
    ? "Webhook verificado"
    : webhookSetup
      ? "Aguardando verificação"
      : "Webhook ainda não verificado";

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Conta WhatsApp Business</p>
            <Badge variant={needsAttention ? "destructive" : "secondary"}>
              {validationLabel}
            </Badge>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <SummaryItem label="WABA ID" value={account.wabaId} code />
            <SummaryItem
              label="App ID"
              value={account.appId || "Não informado"}
              code
            />
            <SummaryItem
              label="Estado da conta"
              value={getOperationalStatusLabel(account.status)}
            />
            <SummaryItem label="Webhook" value={webhookLabel} />
          </div>
          {account.lastValidatedAt ? (
            <p className="text-xs text-muted-foreground">
              Última validação: {formatOperationalDateTime(account.lastValidatedAt)}
            </p>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Atualizar credenciais
            </Button>
            <Button
              size="sm"
              onClick={onConfigureWebhook}
              disabled={isWebhookPending}
            >
              {isWebhookPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Webhook className="h-4 w-4" />
              )}
              {account.webhookConfigured
                ? "Regenerar webhook"
                : "Configurar webhook"}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 border-t pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Números sincronizados
        </p>
        {account.phoneNumbers.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {account.phoneNumbers.map((phone) => (
              <span
                key={phone.id}
                className="rounded-md border bg-muted/20 px-2.5 py-1.5 text-sm"
              >
                {phone.displayPhoneNumber}
                {phone.boundIntegrationId ? " · já usado em um canal" : ""}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum número foi retornado pela Meta para esta conta.
          </p>
        )}
      </div>
    </div>
  );
}

function WebhookInstructions({
  account,
  setup,
  showVerifyToken,
  copiedTarget,
  isRefreshing,
  onCopy,
  onToggleToken,
  onRefresh,
}: {
  account: OperationalMetaManualAccount;
  setup: WebhookSetup;
  showVerifyToken: boolean;
  copiedTarget: string | null;
  isRefreshing: boolean;
  onCopy: (target: string, value: string) => Promise<void>;
  onToggleToken: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="font-medium">Cadastre estes dados no app da Meta</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No painel do app, abra a configuração do WhatsApp e informe a
          callback URL e o token de verificação abaixo.
        </p>
      </div>
      <CopyField
        id={`operational-meta-webhook-url-${account.wabaId}`}
        label="Callback URL"
        value={setup.webhookUrl}
        type="url"
        copied={copiedTarget === `${account.wabaId}:url`}
        onCopy={() => onCopy(`${account.wabaId}:url`, setup.webhookUrl)}
      />
      <CopyField
        id={`operational-meta-webhook-token-${account.wabaId}`}
        label="Token de verificação"
        value={setup.verifyToken}
        type={showVerifyToken ? "text" : "password"}
        copied={copiedTarget === `${account.wabaId}:token`}
        onCopy={() => onCopy(`${account.wabaId}:token`, setup.verifyToken)}
        action={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onToggleToken}
            aria-label={showVerifyToken ? "Ocultar token" : "Mostrar token"}
          >
            {showVerifyToken ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <div className="rounded-md border bg-background/70 p-3 text-sm">
        <p className="font-medium">Depois de salvar no Meta</p>
        <p className="mt-1 text-muted-foreground">
          Clique em “Atualizar status” para confirmar o handshake. O token não
          será salvo no navegador e será necessário gerar outro se esta janela
          for fechada.
        </p>
        <Button
          className="mt-3"
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Atualizar status
        </Button>
      </div>
    </div>
  );
}

function CopyField({
  id,
  label,
  value,
  type,
  copied,
  onCopy,
  action,
}: {
  id: string;
  label: string;
  value: string;
  type: "text" | "password" | "url";
  copied: boolean;
  onCopy: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          type={type}
          readOnly
          className="min-w-0 font-mono text-xs"
        />
        {action}
        <Button type="button" variant="outline" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  placeholder,
  disabled,
  registration,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        {...registration}
      />
      <FieldError message={error} />
    </div>
  );
}

function SecretFormField({
  id,
  label,
  placeholder,
  disabled,
  registration,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        placeholder={placeholder}
        autoComplete="new-password"
        disabled={disabled}
        {...registration}
      />
      <FieldError message={error} />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  code = false,
}: {
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      {code ? (
        <code className="break-all text-xs font-medium">{value}</code>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function buildManualAccountBody(
  values: ManualAccountFormValues,
): SaveOperationalMetaManualAccountBody {
  return {
    appId: values.appId.trim(),
    appSecret: values.appSecret.trim(),
    accessToken: values.accessToken.trim(),
  };
}

function getManualAccountErrorMessage(error: unknown): string {
  const code = getOperationalErrorCode(error);
  if (code === "META_MANUAL_CREDENTIALS_INVALID") {
    return "A Meta recusou as credenciais. Confirme o App ID, App Secret e token de acesso.";
  }
  if (code === "META_MANUAL_MISSING_SCOPES") {
    return "O token não possui todas as permissões necessárias para o WhatsApp Business.";
  }
  if (code === "META_MANUAL_WABA_NOT_FOUND") {
    return "O WABA ID não foi encontrado ou não pertence a estas credenciais.";
  }
  if (code === "META_MANUAL_NO_PHONE_NUMBERS") {
    return "A Meta não retornou números para este WABA. Verifique se há um número provisionado.";
  }
  if (code === "META_MANUAL_PHONE_NUMBER_CONFLICT") {
    return "Um dos números desta conta já está vinculado a outra empresa.";
  }
  if (code === "META_MANUAL_ENCRYPTION_NOT_CONFIGURED") {
    return "A configuração segura do servidor ainda não está disponível. Tente novamente mais tarde.";
  }
  return getOperationalErrorMessage(
    error,
    "Não foi possível validar a conta Meta. Confira os dados e tente novamente.",
  );
}
