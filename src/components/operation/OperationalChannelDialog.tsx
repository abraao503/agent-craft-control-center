import { useEffect, useRef, useState } from "react";
import {
  useForm,
  Controller,
  UseFormRegisterReturn,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { listOperationalMetaPhoneNumbers } from "@/services/operation/listOperationalMetaPhoneNumbers";
import {
  launchOperationalMetaEmbeddedSignup,
  OperationalMetaEmbeddedSignupError,
} from "@/services/operation/launchOperationalMetaEmbeddedSignup";
import {
  CompleteOperationalMetaOnboardingBody,
  CompleteOperationalMetaOnboardingData,
  OperationalChannel,
  OperationalChannelProvider,
  OperationalChannelProviderName,
  OperationalMetaPhoneNumberAvailability,
  StartOperationalMetaOnboardingData,
} from "@/types/operation-channels";
import {
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const channelFormSchema = z.object({
  provider: z.enum(["z-api", "evolux", "meta-cloud"]),
  displayName: z.string().max(160, "Use no máximo 160 caracteres"),
  externalToken: z.string().max(500, "Use no máximo 500 caracteres"),
  externalClientToken: z.string().max(500, "Use no máximo 500 caracteres"),
  postbackUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .url("Informe uma URL válida")
        .max(2048, "Use no máximo 2048 caracteres"),
    ])
    .optional(),
  metaPhoneNumberId: z.string().max(100, "Use no máximo 100 caracteres"),
});

export type OperationalChannelFormValues = z.infer<typeof channelFormSchema>;

type MetaOnboardingState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "waiting"; data: StartOperationalMetaOnboardingData }
  | { phase: "completing"; phoneNumberId: string }
  | { phase: "success"; data: CompleteOperationalMetaOnboardingData }
  | { phase: "cancelled" }
  | { phase: "error"; message: string };

type OperationalChannelDialogProps = {
  open: boolean;
  channel: OperationalChannel | null;
  workspaceId?: string;
  defaultProvider: OperationalChannelProviderName;
  providers: OperationalChannelProvider[];
  providersLoading: boolean;
  canManageConnection: boolean;
  isPending: boolean;
  isOnboardingPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalChannelFormValues) => Promise<void>;
  onStartMetaOnboarding: () => Promise<StartOperationalMetaOnboardingData>;
  onCompleteMetaOnboarding: (
    body: CompleteOperationalMetaOnboardingBody,
  ) => Promise<CompleteOperationalMetaOnboardingData>;
};

export function OperationalChannelDialog({
  open,
  channel,
  workspaceId,
  defaultProvider,
  providers,
  providersLoading,
  canManageConnection,
  isPending,
  isOnboardingPending,
  onOpenChange,
  onSubmit,
  onStartMetaOnboarding,
  onCompleteMetaOnboarding,
}: OperationalChannelDialogProps) {
  const [metaOnboarding, setMetaOnboarding] = useState<MetaOnboardingState>({
    phase: "idle",
  });
  const onboardingAbortRef = useRef<AbortController | null>(null);
  const form = useForm<OperationalChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: getDefaultValues(channel, defaultProvider),
  });
  const selectedProvider = form.watch("provider");
  const shouldLoadMetaPhoneNumbers = Boolean(
    open &&
      !channel &&
      workspaceId &&
      canManageConnection &&
      selectedProvider === "meta-cloud",
  );
  const phoneNumbersQuery = useQuery({
    queryKey: ["operation-meta-phone-numbers", workspaceId],
    queryFn: () => listOperationalMetaPhoneNumbers(workspaceId!),
    enabled: shouldLoadMetaPhoneNumbers,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!open) {
      onboardingAbortRef.current?.abort();
      onboardingAbortRef.current = null;
      setMetaOnboarding({ phase: "idle" });
      return;
    }

    form.reset(getDefaultValues(channel, defaultProvider));
    onboardingAbortRef.current?.abort();
    onboardingAbortRef.current = null;
    setMetaOnboarding({ phase: "idle" });
  }, [channel, defaultProvider, form, open]);

  useEffect(() => {
    if (selectedProvider !== "meta-cloud") {
      onboardingAbortRef.current?.abort();
      onboardingAbortRef.current = null;
      setMetaOnboarding({ phase: "idle" });
    }
  }, [selectedProvider]);

  const handleMetaOnboarding = async () => {
    if (!canManageConnection || isOnboardingPending) return;

    onboardingAbortRef.current?.abort();
    const abortController = new AbortController();
    onboardingAbortRef.current = abortController;
    setMetaOnboarding({ phase: "starting" });

    try {
      const onboarding = await onStartMetaOnboarding();
      if (abortController.signal.aborted) return;

      setMetaOnboarding({ phase: "waiting", data: onboarding });
      const signup = await launchOperationalMetaEmbeddedSignup(
        onboarding,
        abortController.signal,
      );
      if (abortController.signal.aborted) return;

      setMetaOnboarding({
        phase: "completing",
        phoneNumberId: signup.phoneNumberId,
      });
      const completed = await onCompleteMetaOnboarding({
        sessionId: onboarding.sessionId,
        state: onboarding.state,
        code: signup.code,
        wabaId: signup.wabaId,
        phoneNumberId: signup.phoneNumberId,
      });
      if (abortController.signal.aborted) return;

      form.setValue("metaPhoneNumberId", completed.phoneNumberId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setMetaOnboarding({ phase: "success", data: completed });
      void phoneNumbersQuery.refetch();
    } catch (error) {
      if (abortController.signal.aborted) return;

      if (
        error instanceof OperationalMetaEmbeddedSignupError &&
        error.code === "CANCELLED"
      ) {
        setMetaOnboarding({ phase: "cancelled" });
      } else {
        setMetaOnboarding({
          phase: "error",
          message: "Não foi possível concluir a conexão com a Meta. Tente novamente.",
        });
      }
    } finally {
      if (onboardingAbortRef.current === abortController) {
        onboardingAbortRef.current = null;
      }
    }
  };

  const handleCancelMetaOnboarding = () => {
    onboardingAbortRef.current?.abort();
    onboardingAbortRef.current = null;
    setMetaOnboarding({ phase: "cancelled" });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!channel && values.provider === "z-api") {
      let hasMissingValue = false;
      if (!values.externalToken.trim()) {
        form.setError("externalToken", { message: "Informe o token externo" });
        hasMissingValue = true;
      }
      if (!values.externalClientToken.trim()) {
        form.setError("externalClientToken", {
          message: "Informe o token do cliente",
        });
        hasMissingValue = true;
      }
      if (!values.postbackUrl?.trim()) {
        form.setError("postbackUrl", { message: "Informe a URL de postback" });
        hasMissingValue = true;
      }
      if (hasMissingValue) return;
    }

    if (
      !channel &&
      values.provider === "meta-cloud" &&
      !values.metaPhoneNumberId.trim()
    ) {
      form.setError("metaPhoneNumberId", {
        message: "Informe o phone number ID da Meta",
      });
      return;
    }

    await onSubmit(values);
  });

  const selectedProviderDetails = providers.find(
    (provider) => provider.name === selectedProvider,
  );
  const phoneNumbers = phoneNumbersQuery.data ?? [];
  const showPhoneNumberSelect =
    !channel &&
    selectedProvider === "meta-cloud" &&
    canManageConnection &&
    !phoneNumbersQuery.isError &&
    (phoneNumbersQuery.isLoading || phoneNumbers.length > 0);
  const connectedPhoneNumber =
    metaOnboarding.phase === "success"
      ? phoneNumbers.find(
          (phone) => phone.phoneNumberId === metaOnboarding.data.phoneNumberId,
        )
      : undefined;
  const isMetaOnboardingActive = [
    "starting",
    "waiting",
    "completing",
  ].includes(metaOnboarding.phase);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>
            {channel ? "Editar conexão operacional" : "Nova conexão operacional"}
          </DialogTitle>
          <DialogDescription>
            {channel
              ? "Atualize o nome ou substitua credenciais. A API nunca devolve secrets já gravados."
              : "Conecte um provedor a este ambiente operacional. Depois de salvar, configure a rota de entrada para liberar a ativação."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="operational-channel-provider">Provedor</Label>
            {channel ? (
              <div
                id="operational-channel-provider"
                className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
              </div>
            ) : (
              <Controller
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending || providersLoading}
                  >
                    <SelectTrigger id="operational-channel-provider">
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.name}>
                          {OPERATIONAL_CHANNEL_PROVIDER_LABELS[provider.name] ??
                            provider.alias}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {selectedProviderDetails ? (
              <p className="text-xs text-muted-foreground">
                {selectedProviderDetails.capabilities.connectionMode ===
                "provisioned-number"
                  ? "Usa um número provisionado pela Meta; não exige QR Code."
                  : `Conexão por credenciais${
                      selectedProviderDetails.capabilities.supportsQr
                        ? " e QR Code"
                        : ""
                    }.`}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="operational-channel-display-name">Nome exibido</Label>
            <Input
              id="operational-channel-display-name"
              placeholder="Ex.: WhatsApp recepção"
              maxLength={160}
              disabled={isPending}
              {...form.register("displayName")}
            />
            <FieldError message={form.formState.errors.displayName?.message} />
          </div>

          {selectedProvider === "z-api" ? (
            <div className="space-y-4 rounded-md border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">Credenciais Z-API</p>
                <p className="text-xs text-muted-foreground">
                  {channel
                    ? "Deixe em branco para manter o valor atual. Os campos são somente para gravação (não podem ser lidos depois)."
                    : "Os valores são enviados somente na gravação e nunca aparecem na listagem. Ao ativar, a API registra o webhook operacional no provedor."}
                </p>
              </div>
              <SecretField
                id="operational-channel-external-token"
                label="Token externo"
                disabled={isPending}
                registration={form.register("externalToken")}
                error={form.formState.errors.externalToken?.message}
              />
              <SecretField
                id="operational-channel-client-token"
                label="Token do cliente"
                disabled={isPending}
                registration={form.register("externalClientToken")}
                error={form.formState.errors.externalClientToken?.message}
              />
              <div className="space-y-2">
                <Label htmlFor="operational-channel-postback-url">
                  URL de postback
                </Label>
                <Input
                  id="operational-channel-postback-url"
                  type="url"
                  placeholder="https://..."
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("postbackUrl")}
                />
                <FieldError message={form.formState.errors.postbackUrl?.message} />
              </div>
            </div>
          ) : null}

          {selectedProvider === "evolux" ? (
            <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
              A instância Evolux é provisionada pela API. Depois de salvar, a
              tela abrirá a configuração da rota de entrada antes de liberar a
              ativação e o recebimento de mensagens.
            </div>
          ) : null}

          {selectedProvider === "meta-cloud" ? (
            <div className="space-y-4 rounded-md border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <Label htmlFor="operational-channel-meta-phone-number-id">
                    Número provisionado
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Conecte o número pela Meta ou selecione um número já
                    sincronizado com a empresa.
                  </p>
                </div>
                {!channel && canManageConnection ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleMetaOnboarding()}
                    disabled={
                      isPending || isOnboardingPending || isMetaOnboardingActive
                    }
                  >
                    {isOnboardingPending || isMetaOnboardingActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {metaOnboarding.phase === "success"
                      ? "Conectar outro número"
                      : "Conectar com a Meta"}
                  </Button>
                ) : null}
              </div>

              {channel ? (
                <div className="rounded-md border bg-background px-3 py-2 text-sm">
                  {channel.metaDisplayPhoneNumber ||
                    channel.metaPhoneNumberId ||
                    "Número não informado"}
                </div>
              ) : showPhoneNumberSelect ? (
                <Controller
                  control={form.control}
                  name="metaPhoneNumberId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isPending || phoneNumbersQuery.isLoading}
                    >
                      <SelectTrigger id="operational-channel-meta-phone-number-id">
                        <SelectValue
                          placeholder={
                            phoneNumbersQuery.isLoading
                              ? "Carregando números..."
                              : "Escolha um número"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneNumbers.map((phone) => (
                          <SelectItem
                            key={phone.phoneNumberId}
                            value={phone.phoneNumberId}
                            disabled={Boolean(phone.boundWorkspaceId)}
                          >
                            {formatOperationalMetaPhone(phone)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : metaOnboarding.phase !== "success" ? (
                <Input
                  id="operational-channel-meta-phone-number-id"
                  placeholder="phone_number_id da Meta"
                  disabled={isPending || isMetaOnboardingActive}
                  {...form.register("metaPhoneNumberId")}
                />
              ) : null}

              {metaOnboarding.phase === "starting" ? (
                <p className="text-sm text-muted-foreground">
                  Preparando a conexão segura com a Meta...
                </p>
              ) : null}
              {metaOnboarding.phase === "waiting" ? (
                <div className="space-y-2 rounded-md border border-primary/30 bg-background p-3 text-sm">
                  <p className="font-medium">Conclua o cadastro na janela da Meta</p>
                  <p className="text-xs text-muted-foreground">
                    Autorize o acesso e escolha o número do ambiente
                    operacional. Nenhum token é exibido nesta tela.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelMetaOnboarding}
                  >
                    Cancelar conexão
                  </Button>
                </div>
              ) : null}
              {metaOnboarding.phase === "completing" ? (
                <p className="text-sm text-muted-foreground">
                  Validando o número selecionado e ativando a conta Meta...
                </p>
              ) : null}
              {metaOnboarding.phase === "cancelled" ? (
                <p className="text-sm text-muted-foreground">
                  A conexão foi cancelada. Você pode tentar novamente quando
                  estiver pronto.
                </p>
              ) : null}
              {metaOnboarding.phase === "error" ? (
                <p className="text-sm text-destructive">
                  {metaOnboarding.message}
                </p>
              ) : null}
              {metaOnboarding.phase === "success" ? (
                <div className="space-y-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-950/30">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Número conectado com sucesso
                  </p>
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <Property label="Número" value={connectedPhoneNumber?.displayPhoneNumber || metaOnboarding.data.phoneNumberId} />
                    <Property label="WABA" value={metaOnboarding.data.wabaId} />
                  </div>
                  <p className="text-xs text-green-800/80 dark:text-green-200/80">
                    Confirme abaixo para criar a conexão deste número neste
                    ambiente.
                  </p>
                </div>
              ) : null}
              <FieldError
                message={form.formState.errors.metaPhoneNumberId?.message}
              />
              {!channel && phoneNumbersQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Não foi possível carregar os números sincronizados. Informe
                  o ID da Meta manualmente ou conecte um novo número.
                </p>
              ) : null}
              {!channel &&
              !phoneNumbersQuery.isLoading &&
              !phoneNumbers.length &&
              !phoneNumbersQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum número Meta sincronizado foi encontrado. Use a
                  conexão com a Meta acima para cadastrar um número.
                </p>
              ) : null}
              {!channel && phoneNumbers.some((phone) => phone.boundWorkspaceId) ? (
                <p className="text-xs text-muted-foreground">
                  Números já utilizados em outro ambiente ficam bloqueados
                  para evitar conexões duplicadas.
                </p>
              ) : null}
            </div>
          ) : null}

          {channel ? (
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Estado atual: {channel.active ? "ativo" : "desativado"} ·
              conexão: {getOperationalStatusLabel(channel.connectionStatus)} ·
              versão {channel.version}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isOnboardingPending || isMetaOnboardingActive}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                isOnboardingPending ||
                isMetaOnboardingActive ||
                (!channel && providersLoading)
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : channel ? (
                "Salvar alterações"
              ) : (
                "Criar conexão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultValues(
  channel: OperationalChannel | null,
  defaultProvider: OperationalChannelProviderName,
): OperationalChannelFormValues {
  return {
    provider: channel?.provider ?? defaultProvider,
    displayName: channel?.displayName ?? "",
    externalToken: "",
    externalClientToken: "",
    postbackUrl: "",
    metaPhoneNumberId: "",
  };
}

function SecretField({
  id,
  label,
  disabled,
  registration,
  error,
}: {
  id: string;
  label: string;
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
        autoComplete="new-password"
        disabled={disabled}
        {...registration}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function Property({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-muted-foreground">{label}</span>
      <p className="break-all font-medium">{value}</p>
    </div>
  );
}

function formatOperationalMetaPhone(
  phone: OperationalMetaPhoneNumberAvailability,
): string {
  const owner = phone.boundWorkspaceId ? " · Já utilizado" : "";
  const verifiedName = phone.verifiedName ? ` · ${phone.verifiedName}` : "";
  return `${phone.displayPhoneNumber} · ${phone.phoneNumberId}${verifiedName}${owner}`;
}
