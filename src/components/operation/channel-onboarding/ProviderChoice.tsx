import { Building2, Globe, Landmark, Loader2 } from "lucide-react";
import { OperationalChannelProvider } from "@/types/operation-channels";
import { OPERATIONAL_CHANNEL_PROVIDER_LABELS } from "@/components/operation/operationalChannelLabels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProviderChoiceProps = {
  providers: OperationalChannelProvider[];
  loading: boolean;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  onSelect: (provider: OperationalChannelProvider) => void;
};

export function ProviderChoice({
  providers,
  loading,
  displayName,
  onDisplayNameChange,
  onSelect,
}: ProviderChoiceProps) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando provedores...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="operational-channel-display-name">Nome do canal</Label>
        <Input
          id="operational-channel-display-name"
          placeholder="Ex.: WhatsApp recepção"
          maxLength={160}
          value={displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use um nome que ajude a equipe a reconhecer este atendimento.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Como as mensagens chegam?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider)}
              className="group flex min-h-32 flex-col rounded-xl border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {provider.name === "meta-cloud" ? (
                  <Building2 className="h-4 w-4" />
                ) : provider.name === "evolux" ? (
                  <Landmark className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </span>
              <span className="mt-3 text-sm font-semibold group-hover:text-primary">
                {OPERATIONAL_CHANNEL_PROVIDER_LABELS[provider.name] ?? provider.alias}
              </span>
              <span className="mt-1 text-xs leading-4 text-muted-foreground">
                {describeProviderConnection(provider)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function describeProviderConnection(
  provider: OperationalChannelProvider,
): string {
  if (provider.capabilities.connectionMode === "provisioned-number") {
    return "Use um número disponível da conta Meta da empresa.";
  }

  if (provider.capabilities.supportsQr) {
    return "Conecte o WhatsApp com um QR Code após definir o destino.";
  }

  return "Informe as credenciais fornecidas pelo provedor.";
}
