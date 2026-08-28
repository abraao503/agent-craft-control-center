import { useEffect } from "react";
import {
  useForm,
  Controller,
  UseFormRegisterReturn,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
import { listMetaCloudPhoneNumbers } from "@/services/whatsapp/metaCloud";
import {
  OperationalChannel,
  OperationalChannelProvider,
  OperationalChannelProviderName,
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

type OperationalChannelDialogProps = {
  open: boolean;
  channel: OperationalChannel | null;
  defaultProvider: OperationalChannelProviderName;
  providers: OperationalChannelProvider[];
  providersLoading: boolean;
  canViewIntegrations: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalChannelFormValues) => Promise<void>;
};

export function OperationalChannelDialog({
  open,
  channel,
  defaultProvider,
  providers,
  providersLoading,
  canViewIntegrations,
  isPending,
  onOpenChange,
  onSubmit,
}: OperationalChannelDialogProps) {
  const { user } = useAuth();
  const form = useForm<OperationalChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: getDefaultValues(channel, defaultProvider),
  });
  const selectedProvider = form.watch("provider");
  const phoneNumbersQuery = useQuery({
    queryKey: ["operation-meta-cloud-phone-numbers", user?.companyId],
    queryFn: listMetaCloudPhoneNumbers,
    enabled: Boolean(
      open &&
        !channel &&
        user?.companyId &&
        canViewIntegrations &&
        selectedProvider === "meta-cloud",
    ),
  });

  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(channel, defaultProvider));
  }, [channel, defaultProvider, form, open]);

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

    if (!channel && values.provider === "meta-cloud" && !values.metaPhoneNumberId.trim()) {
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
    canViewIntegrations &&
    !phoneNumbersQuery.isError &&
    (phoneNumbersQuery.isLoading || phoneNumbers.length > 0);

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
              : "Conecte um provider a este workspace operacional. A conexão será criada como rascunho até a rota ficar válida."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="operational-channel-provider">Provider</Label>
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
                      <SelectValue placeholder="Selecione um provider" />
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
                    ? "Deixe em branco para manter o valor atual. Os campos são write-only."
                    : "Os valores são enviados somente na gravação e nunca aparecem na listagem."}
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
              conexão ainda aguardará uma rota válida e a liberação do runtime.
            </div>
          ) : null}

          {selectedProvider === "meta-cloud" ? (
            <div className="space-y-2 rounded-md border bg-muted/20 p-4">
              <Label htmlFor="operational-channel-meta-phone-number-id">
                Número provisionado
              </Label>
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
                          >
                            {phone.displayPhoneNumber} · {phone.phoneNumberId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <Input
                  id="operational-channel-meta-phone-number-id"
                  placeholder="phone_number_id da Meta"
                  disabled={isPending}
                  {...form.register("metaPhoneNumberId")}
                />
              )}
              <FieldError
                message={form.formState.errors.metaPhoneNumberId?.message}
              />
              {!channel && phoneNumbersQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Não foi possível carregar a lista de números. Informe o ID
                  sincronizado pela empresa manualmente.
                </p>
              ) : null}
              {!channel &&
              canViewIntegrations &&
              !phoneNumbersQuery.isLoading &&
              !phoneNumbers.length &&
              !phoneNumbersQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum número Meta sincronizado foi encontrado para esta
                  empresa.
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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!channel && providersLoading)}
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
