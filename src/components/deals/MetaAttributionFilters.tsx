import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealAttributionOptions } from "@/services/deal/getDealAttributionOptions";
import { LeadAttributionSource } from "@/types/deal";
import { Megaphone } from "lucide-react";

type AttributionSourceFilter =
  | LeadAttributionSource
  | "UNATTRIBUTED"
  | undefined;

type MetaAttributionFiltersProps = {
  options: DealAttributionOptions;
  hasData: boolean;
  attributionSource: AttributionSourceFilter;
  campaignId?: string;
  adId?: string;
  formId?: string;
  onAttributionSourceChange: (value: AttributionSourceFilter) => void;
  onCampaignChange: (value: string | undefined) => void;
  onAdChange: (value: string | undefined) => void;
  onFormChange: (value: string | undefined) => void;
};

const sourceLabels: Record<LeadAttributionSource, string> = {
  META_AD: "Meta · anúncio",
  META_POST: "Meta · publicação",
  META_LEAD_FORM: "Meta · formulário",
  UNKNOWN: "Origem desconhecida",
};

export function MetaAttributionFilters({
  options,
  hasData,
  attributionSource,
  campaignId,
  adId,
  formId,
  onAttributionSourceChange,
  onCampaignChange,
  onAdChange,
  onFormChange,
}: MetaAttributionFiltersProps) {
  const activeFilterCount = [
    attributionSource,
    campaignId,
    adId,
    formId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onAttributionSourceChange(undefined);
    onCampaignChange(undefined);
    onAdChange(undefined);
    onFormChange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-2"
        >
          <Megaphone className="h-4 w-4" />
          Atribuição Meta
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center bg-background px-1.5"
            >
              {activeFilterCount}
            </Badge>
          )}
          {!hasData && (
            <span
              className="h-2 w-2 rounded-full bg-amber-500"
              title="Aguardando os primeiros dados de atribuição"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(480px,calc(100vw-2rem))] space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">Atribuição Meta</p>
            <p className="text-xs text-muted-foreground">
              Filtre os negócios pela origem do primeiro contato atribuído.
            </p>
          </div>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-muted-foreground"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>

        {!hasData && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            A integração está ativa. As opções ficarão disponíveis quando
            chegarem os primeiros dados de atribuição.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Origem inicial</Label>
            <Select
              disabled={!hasData}
              value={attributionSource || "__all"}
              onValueChange={(value) =>
                onAttributionSourceChange(
                  value === "__all"
                    ? undefined
                    : (value as Exclude<
                        AttributionSourceFilter,
                        undefined
                      >),
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Origem inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as origens</SelectItem>
                <SelectItem value="UNATTRIBUTED">
                  Origem não informada
                </SelectItem>
                {options.sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {sourceLabels[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Campanha inicial</Label>
            <Select
              disabled={!hasData}
              value={campaignId || "__all"}
              onValueChange={(value) =>
                onCampaignChange(value === "__all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Campanha inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as campanhas</SelectItem>
                {options.campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Anúncio inicial</Label>
            <Select
              disabled={!hasData}
              value={adId || "__all"}
              onValueChange={(value) =>
                onAdChange(value === "__all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Anúncio inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os anúncios</SelectItem>
                {options.ads.map((ad) => (
                  <SelectItem key={ad.id} value={ad.id}>
                    {ad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Formulário inicial</Label>
            <Select
              disabled={!hasData}
              value={formId || "__all"}
              onValueChange={(value) =>
                onFormChange(value === "__all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Formulário inicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os formulários</SelectItem>
                {(options.forms ?? []).map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
