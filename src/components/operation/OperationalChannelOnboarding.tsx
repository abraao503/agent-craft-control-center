import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  Wifi,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  listOperationalMetaPhoneNumbers,
  selectFreeOperationalMetaPhoneNumbers,
} from "@/services/operation/listOperationalMetaPhoneNumbers";
import {
  CreateOperationalChannelBody,
  OperationalChannel,
  OperationalChannelProvider,
  OperationalMetaPhoneNumberAvailability,
} from "@/types/operation-channels";
import { ServiceArea, ServiceQueue } from "@/types/operation";
import { OperationalAssistantOption } from "@/types/operation-assistant";
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  getOperationalErrorCode,
  getOperationalErrorMessage,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import {
  buildRouteMenuConfiguration,
  OperationalRouteFields,
  OperationalRouteFormValues,
  routeFormSchema,
} from "@/components/operation/OperationalRouteFields";
import { OperationalMetaManualAccountCard } from "@/components/operation/OperationalMetaManualAccountCard";
import {
  OnboardingProgress,
  OnboardingStage,
} from "@/components/operation/channel-onboarding/OnboardingProgress";
import { ProviderChoice } from "@/components/operation/channel-onboarding/ProviderChoice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type OnboardingStep = "provider" | "configure" | "destination" | "connect" | "done";

type ZApiFieldKey = "externalToken" | "externalClientToken" | "postbackUrl";

type DraftChannel = {
  provider: OperationalChannelProvider["name"] | null;
  displayName: string;
  metaPhoneNumberId: string;
  zApiExternalToken: string;
  zApiExternalClientToken: string;
  zApiPostbackUrl: string;
};

const EMPTY_DRAFT: DraftChannel = {
  provider: null,
  displayName: "",
  metaPhoneNumberId: "",
  zApiExternalToken: "",
  zApiExternalClientToken: "",
  zApiPostbackUrl: "",
};

const ZAPI_VALIDATORS: Record<ZApiFieldKey, (value: string) => string | undefined> = {
  externalToken: (value) => (value.trim() ? undefined : "Informe o token externo"),
  externalClientToken: (value) =>
    value.trim() ? undefined : "Informe o token do cliente",
  postbackUrl: (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Informe a URL de postback";
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      return "Informe uma URL válida iniciada por https:// ou http://";
    }
    return undefined;
  },
};

export type OperationalRouteOptionsBundle = {
  areas: ServiceArea[];
  queues: ServiceQueue[];
  assistants: OperationalAssistantOption[];
  triageAgents: OperationalTriageAgent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export type OperationalChannelOnboardingProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  providers: OperationalChannelProvider[];
  providersLoading: boolean;
  canManageCompanyMeta: boolean;
  isCreating: boolean;
  channel: OperationalChannel | null;
  routeOptions: OperationalRouteOptionsBundle;
  allowExternalAgent: boolean;
  onCreateChannel: (body: CreateOperationalChannelBody) => Promise<OperationalChannel>;
  onSaveDestination: (
    channelId: string,
    values: OperationalRouteFormValues,
  ) => Promise<void>;
  onActivateChannel: (channelId: string) => Promise<void>;
  onRequestQrCode: (channelId: string) => Promise<string>;
  onRefreshStatus: () => Promise<void> | void;
};

export function OperationalChannelOnboarding({
  open,
  onOpenChange,
  workspaceId,
  providers,
  providersLoading,
  canManageCompanyMeta,
  isCreating,
  channel,
  routeOptions,
  allowExternalAgent,
  onCreateChannel,
  onSaveDestination,
  onActivateChannel,
  onRequestQrCode,
  onRefreshStatus,
}: OperationalChannelOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("provider");
  const [draft, setDraft] = useState<DraftChannel>(EMPTY_DRAFT);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdChannelId, setCreatedChannelId] = useState<string | null>(null);
  const [zApiFieldErrors, setZApiFieldErrors] = useState<
    Partial<Record<ZApiFieldKey, string>>
  >({});
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isSavingDestination, setIsSavingDestination] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);

  const destinationForm = useForm<OperationalRouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      channelId: "",
      entryMode: "TRIAGE",
      triageAgentId: null,
      assistantId: null,
      targetAreaId: null,
      targetQueueId: null,
      fallbackAreaId: null,
      fallbackQueueId: null,
      menuGreeting: null,
      invalidMenuMessage: null,
      handoffAreaId: null,
      handoffQueueId: null,
      menuOptions: [],
      active: true,
    },
  });

  const shouldLoadMetaPhoneNumbers = Boolean(
    open && workspaceId && draft.provider === "meta-cloud" && step === "configure",
  );
  const phoneNumbersQuery = useQuery({
    queryKey: ["operation-meta-phone-numbers", workspaceId],
    queryFn: () => listOperationalMetaPhoneNumbers(workspaceId!),
    enabled: shouldLoadMetaPhoneNumbers,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const phoneNumbers = useMemo(
    () => selectFreeOperationalMetaPhoneNumbers(phoneNumbersQuery.data ?? []),
    [phoneNumbersQuery.data],
  );

  const createdChannel = channel;
  const connectionReady = Boolean(
    createdChannel &&
      createdChannel.active &&
      ["CONNECTED", "OPEN"].includes(createdChannel.connectionStatus.toUpperCase()),
  );
  const destinationSummary = useMemo(() => {
    const values = destinationForm.watch();
    if (values.entryMode === "TRIAGE") {
      return OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS.TRIAGE;
    }
    if (values.entryMode === "QUEUE") {
      const area = routeOptions.areas.find((item) => item.id === values.targetAreaId);
      const queue = routeOptions.queues.find((item) => item.id === values.targetQueueId);
      return `${area?.name || "Área pendente"} → ${queue?.name || "Fila pendente"}`;
    }
    if (values.entryMode === "ASSISTANT") {
      const assistant = routeOptions.assistants.find(
        (item) => item.id === values.assistantId,
      );
      const fallbackArea = routeOptions.areas.find(
        (item) => item.id === values.fallbackAreaId,
      );
      const fallbackQueue = routeOptions.queues.find(
        (item) => item.id === values.fallbackQueueId,
      );
      return `${assistant?.name || "Agente indisponível"} · alternativa: ${
        fallbackArea?.name || "Área indisponível"
      } / ${fallbackQueue?.name || "Fila indisponível"}`;
    }
    const agent = routeOptions.triageAgents.find(
      (item) => item.id === values.triageAgentId,
    );
    return `Integração de triagem: ${
      agent?.name || "indisponível"
    } · menu com ${values.menuOptions.length} opção(ões)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationForm.watch(), routeOptions]);

  useEffect(() => {
    if (!open || !channel || createdChannelId === channel.id) return;

    setCreatedChannelId(channel.id);
    setDraft((current) => ({
      ...current,
      provider: channel.provider,
      displayName: channel.displayName ?? "",
      metaPhoneNumberId: channel.metaPhoneNumberId ?? "",
    }));
    destinationForm.setValue("channelId", channel.id);
    setStep(
      !channel.route.configured
        ? "destination"
        : channel.active &&
            ["CONNECTED", "OPEN"].includes(
              channel.connectionStatus.toUpperCase(),
            )
          ? "done"
          : "connect",
    );
    // Inicializa apenas ao retomar outro canal; atualizações de status não
    // devem devolver o usuário para uma etapa anterior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel?.id]);

  useEffect(() => {
    if (step !== "connect" || connectionReady) return;
    if (!createdChannel) return;

    const interval = window.setInterval(() => {
      void onRefreshStatus();
    }, 5000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, connectionReady, createdChannel?.id]);

  useEffect(() => {
    if (step === "connect" && connectionReady) {
      setStep("done");
    }
  }, [step, connectionReady]);

  const reset = () => {
    setStep("provider");
    setDraft(EMPTY_DRAFT);
    setSubmitError(null);
    setZApiFieldErrors({});
    setCreatedChannelId(null);
    setQrCode(null);
    setDestinationError(null);
    setActivationError(null);
    destinationForm.reset();
  };

  const handleClose = (nextOpen: boolean) => {
    if (isCreating || isSavingDestination || isActivating || isRequestingQr) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmitProviderConfig = async () => {
    if (!draft.provider) return;

    if (draft.provider === "z-api") {
      const nextErrors: Partial<Record<ZApiFieldKey, string>> = {};
      const valuesByField: Record<ZApiFieldKey, string> = {
        externalToken: draft.zApiExternalToken,
        externalClientToken: draft.zApiExternalClientToken,
        postbackUrl: draft.zApiPostbackUrl,
      };
      (Object.keys(valuesByField) as ZApiFieldKey[]).forEach((key) => {
        const error = ZAPI_VALIDATORS[key](valuesByField[key]);
        if (error) {
          nextErrors[key] = error;
        }
      });
      setZApiFieldErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) {
        return;
      }
    }

    if (draft.provider === "meta-cloud" && !draft.metaPhoneNumberId) {
      setSubmitError("Escolha um número livre da conta Meta da empresa.");
      return;
    }

    setSubmitError(null);
    try {
      const created = await onCreateChannel(buildCreateChannelBody(draft));
      setCreatedChannelId(created.id);
      destinationForm.reset({
        channelId: created.id,
        entryMode: "TRIAGE",
        triageAgentId: null,
        assistantId: null,
        targetAreaId: null,
        targetQueueId: null,
        fallbackAreaId: null,
        fallbackQueueId: null,
        menuGreeting: null,
        invalidMenuMessage: null,
        handoffAreaId: null,
        handoffQueueId: null,
        menuOptions: [],
        active: true,
      });
      setStep("destination");
    } catch (error) {
      setSubmitError(getOnboardingSubmitErrorMessage(draft.provider, error));
    }
  };

  const handleSaveDestination = async () => {
    if (!createdChannelId) return;

    const values = destinationForm.getValues();
    const valid = await destinationForm.trigger();
    if (!valid) return;

    setIsSavingDestination(true);
    setDestinationError(null);
    try {
      await onSaveDestination(createdChannelId, values);
      setStep("connect");
    } catch (error) {
      setDestinationError(getOperationalErrorMessage(error, "Verifique os destinos e tente novamente."));
    } finally {
      setIsSavingDestination(false);
    }
  };

  const handleActivate = async () => {
    if (!createdChannelId) return;

    setIsActivating(true);
    setActivationError(null);
    try {
      await onActivateChannel(createdChannelId);
      setStep(connectionReady ? "done" : "connect");
    } catch (error) {
      setActivationError(getActivationErrorMessage(error));
    } finally {
      setIsActivating(false);
    }
  };

  const handleRequestQr = async () => {
    if (!createdChannelId) return;

    setIsRequestingQr(true);
    try {
      const value = await onRequestQrCode(createdChannelId);
      setQrCode(value);
    } catch (error) {
      setActivationError(
        getOperationalErrorMessage(error, "Não foi possível solicitar o QR Code."),
      );
    } finally {
      setIsRequestingQr(false);
    }
  };

  const supportsQr = Boolean(createdChannel?.capabilities.supportsQr);
  const selectedProvider = providers.find(
    (provider) => provider.name === draft.provider,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {step === "provider"
              ? "Novo canal"
              : step === "configure"
                ? draft.provider
                  ? `Configurar ${OPERATIONAL_CHANNEL_PROVIDER_LABELS[draft.provider]}`
                  : "Configurar canal"
                : step === "destination"
                  ? "Destino das mensagens"
                  : step === "connect"
                    ? "Concluir conexão"
                    : "Canal pronto"}
          </DialogTitle>
          <DialogDescription>
            {step === "provider"
              ? "Dê um nome ao canal e escolha como as mensagens chegarão."
              : step === "configure"
                ? "Informe somente os dados exigidos por este provedor."
                : step === "destination"
                  ? "Escolha para onde as mensagens deste canal serão direcionadas."
                  : step === "connect"
                    ? "Conclua a conexão com o provedor para liberar o recebimento."
                    : "Confirme a prontidão do canal e escolha o próximo destino."}
          </DialogDescription>
        </DialogHeader>

        <OnboardingProgress stage={getOnboardingStage(step)} />

        {step === "provider" ? (
          <ProviderChoice
            providers={providers}
            loading={providersLoading}
            displayName={draft.displayName}
            onDisplayNameChange={(displayName) =>
              setDraft((current) => ({ ...current, displayName }))
            }
            onSelect={(provider) => {
              setDraft((current) => ({
                ...current,
                provider: provider.name,
              }));
              setStep("configure");
            }}
          />
        ) : null}

        {step === "configure" ? (
          <div className="space-y-4">
            {draft.provider === "meta-cloud" ? (
              <MetaCloudConfiguration
                workspaceId={workspaceId}
                isLoading={phoneNumbersQuery.isLoading}
                isError={phoneNumbersQuery.isError}
                errorMessage={phoneNumbersQuery.error}
                phoneNumbers={phoneNumbers}
                canManageCompanyMeta={canManageCompanyMeta}
                selectedPhoneNumberId={draft.metaPhoneNumberId}
                onSelectPhoneNumber={(phoneNumberId) =>
                  setDraft((current) => ({
                    ...current,
                    metaPhoneNumberId: phoneNumberId,
                  }))
                }
                onRetry={() => phoneNumbersQuery.refetch()}
              />
            ) : null}

            {draft.provider === "z-api" ? (
              <ZApiCredentialsFields
                draft={draft}
                errors={zApiFieldErrors}
                isPending={false}
                onDraftChange={(changes) =>
                  setDraft((current) => ({ ...current, ...changes }))
                }
                onValidateField={(field, value) =>
                  setZApiFieldErrors((current) => ({
                    ...current,
                    [field]: ZAPI_VALIDATORS[field](value),
                  }))
                }
              />
            ) : null}

            {draft.provider === "evolux" ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <p className="font-medium">Nenhum dado adicional agora</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedProvider?.capabilities.supportsQr
                    ? "Depois de definir o destino, você ativará o canal e conectará o WhatsApp com um QR Code."
                    : "Depois de definir o destino, você poderá ativar e acompanhar a conexão deste canal."}
                </p>
              </div>
            ) : null}

            {submitError ? (
              <p className="text-xs text-destructive">{submitError}</p>
            ) : null}
          </div>
        ) : null}

        {step === "destination" ? (
          <div className="space-y-4">
            <OperationalRouteFields
              form={destinationForm}
              channelLabel={
                createdChannel
                  ? `${createdChannel.displayName || createdChannel.providerAlias} · ${
                      OPERATIONAL_CHANNEL_PROVIDER_LABELS[createdChannel.provider]
                    }`
                  : undefined
              }
              route={null}
              areas={routeOptions.areas}
              queues={routeOptions.queues}
              assistants={routeOptions.assistants}
              triageAgents={routeOptions.triageAgents}
              allowExternalAgent={allowExternalAgent}
              optionsLoading={routeOptions.isLoading}
              optionsError={routeOptions.isError}
              isPending={isSavingDestination}
            />
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumo do destino
              </p>
              <p className="mt-1 font-medium">{destinationSummary}</p>
            </div>
            {destinationError ? (
              <p className="text-xs text-destructive">{destinationError}</p>
            ) : null}
          </div>
        ) : null}

        {step === "connect" ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="font-medium">Estado atual</p>
              <p className="mt-1 text-muted-foreground">
                {createdChannel
                  ? `${getOperationalStatusLabel(createdChannel.connectionStatus)}${
                      supportsQr ? " · este provedor exige QR Code para concluir a conexão" : ""
                    }`
                  : "Consultando o status do canal..."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                O status é atualizado automaticamente; não é necessário atualizar manualmente.
              </p>
            </div>

            {activationError ? (
              <p className="text-xs text-destructive">{activationError}</p>
            ) : null}

            {createdChannel && !createdChannel.active ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => void handleActivate()}
                disabled={isActivating}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  "Ativar canal"
                )}
              </Button>
            ) : null}

            {createdChannel && supportsQr && !connectionReady ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">QR Code do provedor</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gere o código e escaneie com o WhatsApp para conectar este canal.
                    </p>
                  </div>
                </div>
                {qrCode ? (
                  <QrPreview value={qrCode} />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => void handleRequestQr()}
                    disabled={isRequestingQr}
                  >
                    {isRequestingQr ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "done" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-950 dark:text-emerald-100">
                  Canal pronto para receber mensagens
                </p>
                <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                  {createdChannel
                    ? `${createdChannel.displayName || createdChannel.providerAlias} · ${
                        OPERATIONAL_CHANNEL_PROVIDER_LABELS[createdChannel.provider]
                      }${createdChannel.metaDisplayPhoneNumber ? ` · ${createdChannel.metaDisplayPhoneNumber}` : ""}`
                    : "Consultando dados do canal..."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Destino: {destinationSummary}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {step === "configure" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("provider")}
                disabled={isCreating}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {step === "configure" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button onClick={() => void handleSubmitProviderConfig()} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar canal"
                  )}
                </Button>
              </>
            ) : null}
            {step === "destination" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isSavingDestination}
                >
                  Concluir depois
                </Button>
                <Button
                  onClick={() => void handleSaveDestination()}
                  disabled={isSavingDestination || routeOptions.isError}
                >
                  {isSavingDestination ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Avançar"
                  )}
                </Button>
              </>
            ) : null}
            {step === "connect" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isActivating || isRequestingQr}
                >
                  Concluir depois
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void onRefreshStatus()}
                  disabled={isActivating || isRequestingQr}
                >
                  Atualizar status
                </Button>
              </>
            ) : null}
            {step === "done" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleClose(false);
                    navigate("/operation/attendances");
                  }}
                >
                  Ir para atendimentos
                </Button>
                <Button onClick={() => handleClose(false)}>Concluir</Button>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getOnboardingStage(step: OnboardingStep): OnboardingStage {
  if (step === "destination") return "destination";
  if (step === "connect" || step === "done") return "connection";
  return "channel";
}

function getOnboardingSubmitErrorMessage(
  provider: OperationalChannelProvider["name"] | null,
  error: unknown,
): string {
  const code = getOperationalErrorCode(error);
  if (code === "META_PHONE_NUMBER_IN_USE") {
    return "Este número já está vinculado a outro canal operacional. Escolha outro número livre.";
  }
  if (code === "PROVIDER_CREDENTIALS_INCOMPLETE") {
    return "Complete as credenciais e a URL de postback antes de criar o canal.";
  }
  if (provider === "meta-cloud" && code === "META_PHONE_NUMBER_NOT_FOUND") {
    return "O número escolhido não está sincronizado ou não pertence à empresa.";
  }
  return getOperationalErrorMessage(error, "Não foi possível criar o canal.");
}

function getActivationErrorMessage(error: unknown): string {
  const code = getOperationalErrorCode(error);
  if (code === "ROUTE_INCOMPLETE") {
    return "Defina um destino válido antes de ativar o canal.";
  }
  if (code === "OPERATIONAL_RUNTIME_NOT_READY") {
    return getOperationalErrorMessage(error, "O recebimento de mensagens ainda não está disponível.");
  }
  return getOperationalErrorMessage(error, "Não foi possível ativar o canal.");
}

function QrPreview({ value }: { value: string }) {
  if (value.startsWith("data:image/")) {
    return (
      <img
        src={value}
        alt="QR Code para conectar o canal"
        className="mx-auto max-h-72 w-auto rounded-md border bg-background p-2"
      />
    );
  }

  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/30 p-3 text-xs">
      {value}
    </pre>
  );
}

function MetaCloudConfiguration({
  workspaceId,
  isLoading,
  isError,
  phoneNumbers,
  canManageCompanyMeta,
  selectedPhoneNumberId,
  onSelectPhoneNumber,
  onRetry,
}: {
  workspaceId?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: unknown;
  phoneNumbers: OperationalMetaPhoneNumberAvailability[];
  canManageCompanyMeta: boolean;
  selectedPhoneNumberId: string;
  onSelectPhoneNumber: (phoneNumberId: string) => void;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando números da conta Meta da empresa...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium">Não foi possível carregar os números</p>
        <p className="text-muted-foreground">
          Tente novamente em instantes para conferir os números livres da conta
          Meta da empresa.
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Atualizar
        </Button>
      </div>
    );
  }

  if (phoneNumbers.length) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="onboarding-meta-phone-number">Número para o canal</Label>
          <p className="text-xs text-muted-foreground">
            Escolha um número livre sincronizado pela conta Meta da empresa.
          </p>
        </div>
        <Select
          value={selectedPhoneNumberId || undefined}
          onValueChange={onSelectPhoneNumber}
        >
          <SelectTrigger id="onboarding-meta-phone-number">
            <SelectValue placeholder="Escolha um número" />
          </SelectTrigger>
          <SelectContent>
            {phoneNumbers.map((phone) => (
              <SelectItem key={phone.phoneNumberId} value={phone.phoneNumberId}>
                {phone.displayPhoneNumber} · {phone.phoneNumberId}
                {phone.verifiedName ? ` · ${phone.verifiedName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm">
      <p className="font-medium">Pré-requisito corporativo pendente</p>
      <p className="text-muted-foreground">
        A conta Meta da empresa ainda não está configurada ou todos os números
        sincronizados já estão em uso.
      </p>
      {canManageCompanyMeta && workspaceId ? (
        <>
          <p className="text-xs text-muted-foreground">
            Conclua o pré-requisito abaixo; este onboarding retoma o ponto atual
            automaticamente quando a conta ficar pronta.
          </p>
          <OperationalMetaManualAccountCard
            workspaceId={workspaceId}
            presentation="trigger"
          />
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Peça ao administrador da empresa para configurar a conta Meta ou
          liberar um número antes de criar este canal.
        </p>
      )}
    </div>
  );
}

function ZApiCredentialsFields({
  draft,
  errors,
  isPending,
  onDraftChange,
  onValidateField,
}: {
  draft: DraftChannel;
  errors: Partial<Record<ZApiFieldKey, string>>;
  isPending: boolean;
  onDraftChange: (changes: Partial<DraftChannel>) => void;
  onValidateField: (field: ZApiFieldKey, value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Credenciais Z-API</p>
        <p className="text-xs text-muted-foreground">
          Os valores são enviados somente na gravação e não podem ser recuperados
          depois.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="onboarding-zapi-external-token">Token externo</Label>
        <Input
          id="onboarding-zapi-external-token"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          aria-invalid={Boolean(errors.externalToken)}
          value={draft.zApiExternalToken}
          onChange={(event) =>
            onDraftChange({ zApiExternalToken: event.target.value })
          }
          onBlur={(event) => onValidateField("externalToken", event.target.value)}
        />
        {errors.externalToken ? (
          <p className="text-xs text-destructive">{errors.externalToken}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="onboarding-zapi-client-token">Token do cliente</Label>
        <Input
          id="onboarding-zapi-client-token"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          aria-invalid={Boolean(errors.externalClientToken)}
          value={draft.zApiExternalClientToken}
          onChange={(event) =>
            onDraftChange({ zApiExternalClientToken: event.target.value })
          }
          onBlur={(event) =>
            onValidateField("externalClientToken", event.target.value)
          }
        />
        {errors.externalClientToken ? (
          <p className="text-xs text-destructive">{errors.externalClientToken}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="onboarding-zapi-postback-url">URL de postback</Label>
        <Input
          id="onboarding-zapi-postback-url"
          type="url"
          placeholder="https://..."
          autoComplete="off"
          disabled={isPending}
          aria-invalid={Boolean(errors.postbackUrl)}
          value={draft.zApiPostbackUrl}
          onChange={(event) =>
            onDraftChange({ zApiPostbackUrl: event.target.value })
          }
          onBlur={(event) => onValidateField("postbackUrl", event.target.value)}
        />
        {errors.postbackUrl ? (
          <p className="text-xs text-destructive">{errors.postbackUrl}</p>
        ) : null}
      </div>
    </div>
  );
}

function buildCreateChannelBody(draft: DraftChannel): CreateOperationalChannelBody {
  const displayName = draft.displayName.trim();

  if (draft.provider === "z-api") {
    return {
      provider: "z-api",
      ...(displayName ? { displayName } : {}),
      credentials: {
        externalToken: draft.zApiExternalToken.trim(),
        externalClientToken: draft.zApiExternalClientToken.trim(),
        postbackUrl: draft.zApiPostbackUrl.trim(),
      },
    };
  }

  if (draft.provider === "meta-cloud") {
    return {
      provider: "meta-cloud",
      ...(displayName ? { displayName } : {}),
      metaPhoneNumberId: draft.metaPhoneNumberId,
    };
  }

  return { provider: "evolux", ...(displayName ? { displayName } : {}) };
}
