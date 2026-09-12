import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Globe,
  Landmark,
  Loader2,
} from "lucide-react";
import {
  listOperationalMetaPhoneNumbers,
  selectFreeOperationalMetaPhoneNumbers,
} from "@/services/operation/listOperationalMetaPhoneNumbers";
import {
  CreateOperationalChannelBody,
  OperationalChannelProvider,
  OperationalMetaPhoneNumberAvailability,
} from "@/types/operation-channels";
import { OPERATIONAL_CHANNEL_PROVIDER_LABELS } from "@/components/operation/operationalChannelLabels";
import {
  getOperationalErrorCode,
  getOperationalErrorMessage,
} from "@/components/operation/operationalChannelLabels";
import { OperationalMetaManualAccountCard } from "@/components/operation/OperationalMetaManualAccountCard";
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

type OnboardingStep = "provider" | "configure";

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

export type OperationalChannelOnboardingProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  providers: OperationalChannelProvider[];
  providersLoading: boolean;
  canManageCompanyMeta: boolean;
  isCreating: boolean;
  onCreateChannel: (body: CreateOperationalChannelBody) => Promise<void>;
};

export function OperationalChannelOnboarding({
  open,
  onOpenChange,
  workspaceId,
  providers,
  providersLoading,
  canManageCompanyMeta,
  isCreating,
  onCreateChannel,
}: OperationalChannelOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("provider");
  const [draft, setDraft] = useState<DraftChannel>(EMPTY_DRAFT);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [zApiFieldErrors, setZApiFieldErrors] = useState<
    Partial<Record<ZApiFieldKey, string>>
  >({});

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
  const selectedProvider = providers.find(
    (provider) => provider.name === draft.provider,
  );

  const reset = () => {
    setStep("provider");
    setDraft(EMPTY_DRAFT);
    setSubmitError(null);
    setZApiFieldErrors({});
  };

  const handleClose = (nextOpen: boolean) => {
    if (isCreating) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!draft.provider) return;

    if (draft.provider === "z-api") {
      const nextErrors: Partial<Record<ZApiFieldKey, string>> = {};
      const keys: ZApiFieldKey[] = ["externalToken", "externalClientToken", "postbackUrl"];
      for (const key of keys) {
        const value =
          key === "externalToken"
            ? draft.zApiExternalToken
            : key === "externalClientToken"
              ? draft.zApiExternalClientToken
              : draft.zApiPostbackUrl;
        const error = ZAPI_VALIDATORS[key](value);
        if (error) {
          nextErrors[key] = error;
        }
      }
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
      await onCreateChannel(buildCreateChannelBody(draft));
      reset();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(getOnboardingSubmitErrorMessage(draft.provider, error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {step === "provider" ? "Adicionar canal" : "Configurar o provedor"}
          </DialogTitle>
          <DialogDescription>
            {step === "provider"
              ? "Escolha a tecnologia do canal e um nome opcional para identificá-lo."
              : selectedProvider
                ? describeProviderConfiguration(selectedProvider)
                : "Conclua a configuração do provedor escolhido."}
          </DialogDescription>
        </DialogHeader>

        {step === "provider" ? (
          <div className="space-y-4">
            {providersLoading ? (
              <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando provedores...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="operational-channel-display-name">
                    Nome do canal (opcional)
                  </Label>
                  <Input
                    id="operational-channel-display-name"
                    placeholder="Ex.: WhatsApp recepção"
                    maxLength={160}
                    value={draft.displayName}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          provider: provider.name,
                        }));
                        setStep("configure");
                      }}
                      className="flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {provider.name === "meta-cloud" ? (
                          <Building2 className="h-4 w-4" />
                        ) : provider.name === "evolux" ? (
                          <Landmark className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                        {OPERATIONAL_CHANNEL_PROVIDER_LABELS[provider.name] ??
                          provider.alias}
                      </span>
                      <span className="text-xs leading-4 text-muted-foreground">
                        {describeProviderConnection(provider)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
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
                isPending={isCreating}
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
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                A instância é provisionada automaticamente pela API. A conexão é
                concluída na etapa de conexão, com o QR Code do provedor.
              </div>
            ) : null}

            {submitError ? (
              <p className="text-xs text-destructive">{submitError}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
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
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            {step === "configure" ? (
              <Button onClick={() => void handleSubmit()} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar canal"
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaCloudConfiguration({
  workspaceId,
  isLoading,
  isError,
  errorMessage,
  phoneNumbers,
  canManageCompanyMeta,
  selectedPhoneNumberId,
  onSelectPhoneNumber,
  onRetry,
}: {
  workspaceId?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage: unknown;
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
          Atualizar status
        </Button>
      </div>
    );
  }

  if (phoneNumbers.length) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="onboarding-meta-phone-number">
            Número para o canal
          </Label>
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
        sincronizados já estão vinculados a canais.
      </p>
      {canManageCompanyMeta && workspaceId ? (
        <>
          <p className="text-xs text-muted-foreground">
            Conclua o pré-requisito abaixo; este onboarding retoma o ponto atual
            automaticamente quando a conta ficar pronta.
          </p>
          <OperationalMetaManualAccountCard workspaceId={workspaceId} />
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

function describeProviderConnection(provider: OperationalChannelProvider): string {
  if (provider.capabilities.connectionMode === "provisioned-number") {
    return "Usa a conta Meta da empresa para escolher um número livre; não exige QR Code.";
  }

  return provider.capabilities.supportsQr
    ? "A instância é provisionada pela API; a conexão é concluída com o QR Code na etapa de conexão."
    : "Conexão por credenciais do provedor.";
}

function describeProviderConfiguration(provider: OperationalChannelProvider): string {
  if (provider.name === "z-api") {
    return "Informe as credenciais da instância Z-API. Os valores não podem ser recuperados depois.";
  }
  if (provider.name === "meta-cloud") {
    return "Escolha um número livre da conta Meta da empresa. Se o pré-requisito estiver pendente, conclua-o aqui mesmo.";
  }
  return "A instância é provisionada pela API. Depois de criar o canal, defina o destino das mensagens.";
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
