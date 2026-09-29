import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Phone,
  RefreshCw,
  ShieldAlert,
  Webhook,
} from "lucide-react";
import { useCommercialMetaManualAccountMutations, useCommercialMetaManualAccounts } from "@/hooks/useCommercialMetaManualAccounts";
import { usePermissions } from "@/hooks/usePermissions";
import type { CommercialMetaManualAccount } from "@/types/commercial-meta-manual-account";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  enabled: boolean;
  workspaceId?: string;
  canManageIntegrations: boolean;
};

type Credentials = {
  wabaId: string;
  appId: string;
  appSecret: string;
  accessToken: string;
};

const EMPTY_CREDENTIALS: Credentials = {
  wabaId: "",
  appId: "",
  appSecret: "",
  accessToken: "",
};

function getErrorCode(error: unknown) {
  const responseData = (
    error as { response?: { data?: { code?: string; message?: string } } }
  )?.response?.data;

  return responseData?.code || responseData?.message || "";
}

function getErrorMessage(error: unknown) {
  switch (getErrorCode(error)) {
    case "META_MANUAL_CREDENTIALS_INVALID":
      return "O App ID, App Secret ou token de acesso não foi aceito pela Meta.";
    case "META_MANUAL_MISSING_SCOPES":
      return "O token não possui as permissões exigidas pela Cloud API.";
    case "META_MANUAL_WABA_NOT_FOUND":
      return "A conta WhatsApp Business informada não foi encontrada para essas credenciais.";
    case "META_MANUAL_NO_PHONE_NUMBERS":
      return "A WABA não possui números disponíveis para sincronização.";
    case "META_MANUAL_PHONE_NUMBER_CONFLICT":
      return "Um dos números dessa WABA já está conectado a outro workspace.";
    case "META_MANUAL_GRAPH_FAILED":
      return "A Meta não respondeu à validação. Tente novamente em alguns instantes.";
    case "META_MANUAL_ENCRYPTION_NOT_CONFIGURED":
      return "A configuração segura do servidor está indisponível no momento.";
    case "WORKSPACE_TYPE_INCOMPATIBLE":
      return "A configuração manual da Meta está disponível apenas em workspaces comerciais.";
    default:
      return "Não foi possível validar a conta Meta. Confira os dados e tente novamente.";
  }
}

function statusLabel(status: CommercialMetaManualAccount["status"]) {
  switch (status) {
    case "CONNECTED":
      return "Conectada";
    case "CONNECTING":
      return "Validando";
    case "NEEDS_REAUTHORIZATION":
      return "Requer nova autorização";
    case "DISCONNECTED":
      return "Desconectada";
    case "ERROR":
      return "Requer atenção";
    default:
      return "Indisponível";
  }
}

function phoneStatusLabel(status: string | null) {
  switch (status) {
    case "CONNECTED":
    case "ACTIVE":
      return "Ativo";
    case "PENDING":
    case "CONNECTING":
      return "Pendente";
    case "DISCONNECTED":
      return "Desconectado";
    case "ERROR":
      return "Requer atenção";
    default:
      return status ? "Disponível" : "Não informado";
  }
}

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StepBadge({
  icon,
  label,
  detail,
  state,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  state: "complete" | "pending" | "attention";
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-background p-3">
      <span
        className={
          state === "complete"
            ? "text-emerald-600"
            : state === "attention"
              ? "text-amber-600"
              : "text-muted-foreground"
        }
      >
        {state === "complete" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
        ) : state === "attention" ? (
          <AlertCircle className="mt-0.5 h-4 w-4" />
        ) : (
          icon
        )}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function accountNeedsAttention(account: CommercialMetaManualAccount) {
  return ["CONNECTING", "ERROR", "NEEDS_REAUTHORIZATION"].includes(
    account.status,
  );
}

export function CommercialMetaManualAccountAssistant({
  enabled,
  workspaceId,
  canManageIntegrations,
}: Props) {
  const { has } = usePermissions();
  const canViewIntegrations = has("view:integrations");
  const accountsQuery = useCommercialMetaManualAccounts(
    workspaceId,
    enabled && canViewIntegrations,
  );
  const mutations = useCommercialMetaManualAccountMutations(workspaceId);
  const [credentials, setCredentials] = useState<Credentials>(EMPTY_CREDENTIALS);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const accounts = accountsQuery.data ?? [];
  const selectedAccount =
    accounts.find((account) => account.wabaId === credentials.wabaId) ??
    accounts[0] ??
    null;

  useEffect(() => {
    if (!selectedAccount || credentials.wabaId) return;

    setCredentials((current) => ({
      ...current,
      wabaId: selectedAccount.wabaId,
      appId: selectedAccount.appId ?? "",
    }));
  }, [credentials.wabaId, selectedAccount]);

  if (!enabled) return null;

  const validationComplete = Boolean(selectedAccount?.lastValidatedAt);
  const webhookComplete = Boolean(selectedAccount?.webhookConfigured);
  const numberCount = accounts.reduce(
    (total, account) => total + account.phoneNumbers.length,
    0,
  );
  const accountWarning = accounts.some(
    (account) => account.wabaAlreadyConfiguredInAnotherWorkspace,
  );

  const updateCredential = (field: keyof Credentials, value: string) => {
    setCredentials((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageIntegrations) return;

    const body = {
      wabaId: credentials.wabaId.trim(),
      appId: credentials.appId.trim(),
      appSecret: credentials.appSecret.trim(),
      accessToken: credentials.accessToken.trim(),
    };
    if (!body.wabaId || !body.appId || !body.appSecret || !body.accessToken) {
      setFormError("Preencha o WABA ID, App ID, App Secret e token de acesso.");
      return;
    }

    setFormError(null);
    try {
      await mutations.save.mutateAsync({
        wabaId: body.wabaId,
        body: {
          appId: body.appId,
          appSecret: body.appSecret,
          accessToken: body.accessToken,
        },
      });
      setCredentials((current) => ({
        ...current,
        appSecret: "",
        accessToken: "",
      }));
      setSuccessMessage(
        "Conta Meta validada. Os segredos foram descartados da interface; confira os estados acima.",
      );
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Card className="border-blue-500/20 bg-blue-500/[0.03]">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Configuração da conta Meta</CardTitle>
            <CardDescription className="text-xs">
              Valide a conta deste workspace comercial e acompanhe webhook e números sem intervenção técnica.
            </CardDescription>
          </div>
          <Badge variant={accounts.length ? "secondary" : "outline"}>
            {accountsQuery.isLoading
              ? "Consultando"
              : accountsQuery.isError
                ? "Indisponível"
                : accounts.length
                  ? `${accounts.length} ${accounts.length === 1 ? "conta" : "contas"}`
                  : "Pendente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canViewIntegrations ? (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Configuração restrita</AlertTitle>
            <AlertDescription>
              Você não tem permissão para consultar a integração Meta deste workspace.
            </AlertDescription>
          </Alert>
        ) : null}

        {accountsQuery.isError && canViewIntegrations ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar a conta Meta</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Tente novamente para atualizar os estados da configuração.
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void accountsQuery.refetch()}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StepBadge
            icon={<KeyRound className="mt-0.5 h-4 w-4" />}
            label="Credenciais"
            detail={accounts.length ? "Conta cadastrada" : "Aguardando cadastro"}
            state={accounts.length ? "complete" : "pending"}
          />
          <StepBadge
            icon={<CheckCircle2 className="mt-0.5 h-4 w-4" />}
            label="Validação"
            detail={
              validationComplete
                ? `Validada em ${formatDate(selectedAccount?.lastValidatedAt ?? null)}`
                : "Valide as credenciais na Meta"
            }
            state={
              validationComplete
                ? "complete"
                : accounts.some(accountNeedsAttention)
                  ? "attention"
                  : "pending"
            }
          />
          <StepBadge
            icon={<Webhook className="mt-0.5 h-4 w-4" />}
            label="Webhook"
            detail={webhookComplete ? "Confirmado pela Meta" : "Cadastro pendente na Meta"}
            state={webhookComplete ? "complete" : "pending"}
          />
          <StepBadge
            icon={<Phone className="mt-0.5 h-4 w-4" />}
            label="Números"
            detail={numberCount ? `${numberCount} sincronizado(s)` : "Nenhum sincronizado"}
            state={numberCount ? "complete" : validationComplete ? "attention" : "pending"}
          />
        </div>

        {accountWarning ? (
          <Alert className="border-amber-500/40 bg-amber-500/[0.06]">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertTitle>WABA reutilizada em outro workspace</AlertTitle>
            <AlertDescription>
              A mesma WABA pode ser reutilizada, mas os números já conectados em outro workspace continuam indisponíveis aqui. O vínculo do número é exclusivo.
            </AlertDescription>
          </Alert>
        ) : null}

        {accounts.map((account) => (
          <div key={account.id} className="rounded-md border bg-background p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">Conta Meta configurada</p>
                <p className="text-xs text-muted-foreground">
                  {account.appId ? "App identificado" : "App ID não informado"} · {statusLabel(account.status)}
                </p>
              </div>
              <Badge variant={accountNeedsAttention(account) ? "destructive" : "outline"}>
                {statusLabel(account.status)}
              </Badge>
            </div>
            {account.wabaAlreadyConfiguredInAnotherWorkspace ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                Há números desta WABA vinculados a outro workspace da empresa.
              </p>
            ) : null}
            <div className="mt-3 space-y-1">
              {account.phoneNumbers.length ? (
                account.phoneNumbers.map((phone) => (
                  <div key={phone.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate">
                      {phone.displayPhoneNumber}
                      {phone.verifiedName ? ` · ${phone.verifiedName}` : ""}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {phoneStatusLabel(phone.status)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum número retornado pela Meta.</p>
              )}
            </div>
          </div>
        ))}

        <form className="space-y-4 rounded-md border bg-background p-4" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-medium">Credenciais manuais</p>
            <p className="text-xs text-muted-foreground">
              Para atualizar uma conta, informe novamente os segredos. Eles não são carregados nem exibidos depois do salvamento.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meta-commercial-waba-id">WABA ID</Label>
              <Input
                id="meta-commercial-waba-id"
                value={credentials.wabaId}
                onChange={(event) => updateCredential("wabaId", event.target.value)}
                disabled={!canManageIntegrations || mutations.save.isPending}
                placeholder="ID da conta WhatsApp Business"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-commercial-app-id">App ID</Label>
              <Input
                id="meta-commercial-app-id"
                value={credentials.appId}
                onChange={(event) => updateCredential("appId", event.target.value)}
                disabled={!canManageIntegrations || mutations.save.isPending}
                placeholder="ID do aplicativo Meta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-commercial-app-secret">App Secret</Label>
              <Input
                id="meta-commercial-app-secret"
                type="password"
                autoComplete="new-password"
                value={credentials.appSecret}
                onChange={(event) => updateCredential("appSecret", event.target.value)}
                disabled={!canManageIntegrations || mutations.save.isPending}
                placeholder="Informe o App Secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-commercial-access-token">Token de acesso</Label>
              <Input
                id="meta-commercial-access-token"
                type="password"
                autoComplete="new-password"
                value={credentials.accessToken}
                onChange={(event) => updateCredential("accessToken", event.target.value)}
                disabled={!canManageIntegrations || mutations.save.isPending}
                placeholder="Informe o token de acesso"
              />
            </div>
          </div>
          {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
          {successMessage ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {successMessage}
            </p>
          ) : null}
          {!canManageIntegrations ? (
            <p className="text-xs text-muted-foreground">
              Você pode consultar o estado, mas não tem permissão para alterar as credenciais.
            </p>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={!canManageIntegrations || mutations.save.isPending}
          >
            {mutations.save.isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
            )}
            {mutations.save.isPending ? "Validando na Meta..." : "Validar e salvar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
