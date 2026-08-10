import { LeadAttributionSummary } from "@/types/deal";

export const CONFIGURATION_ENRICHMENT_ERRORS = new Set([
  "COMPANY_META_CONNECTION_REQUIRED",
  "META_TOKEN_REJECTED",
  "META_TOKEN_CIPHERTEXT_INVALID",
  "AD_ACCOUNT_NOT_SELECTED",
]);

export function formatAttributionSourceLabel(
  sourceType: LeadAttributionSummary["sourceType"] | undefined,
  hasAttribution = true,
): string {
  if (!hasAttribution) return "Origem não informada";

  switch (sourceType) {
    case "META_AD":
      return "Meta · anúncio";
    case "META_POST":
      return "Meta · publicação";
    case "META_LEAD_FORM":
      return "Meta · formulário";
    case "UNKNOWN":
      return "Origem desconhecida";
    default:
      return "Origem não informada";
  }
}

export function formatAttributionOrigin(
  attribution: LeadAttributionSummary | null | undefined,
): string {
  if (!attribution) return "Origem não informada";

  const values =
    attribution.sourceType === "META_LEAD_FORM"
      ? [
          attribution.formName,
          attribution.adName,
          attribution.campaignName,
          attribution.formId,
          attribution.adId,
          attribution.campaignId,
          attribution.sourceId,
        ]
      : attribution.sourceType === "META_AD"
        ? [
            attribution.adName,
            attribution.campaignName,
            attribution.title,
            attribution.adId,
            attribution.campaignId,
            attribution.sourceId,
          ]
        : attribution.sourceType === "META_POST"
          ? [attribution.title, attribution.sourceId]
          : [attribution.title, attribution.sourceId];

  return (
    values.find((value): value is string => Boolean(value?.trim())) ??
    formatAttributionSourceLabel(attribution.sourceType)
  );
}

export function formatAttributionEnrichmentState(
  attribution: LeadAttributionSummary,
): string {
  if (
    CONFIGURATION_ENRICHMENT_ERRORS.has(attribution.enrichmentErrorCode ?? "")
  ) {
    return "Configuração necessária";
  }

  if (
    attribution.enrichmentErrorCode === "QUEUE_ENQUEUE_FAILED" ||
    attribution.enrichmentErrorCode === "META_GRAPH_NETWORK" ||
    attribution.enrichmentErrorCode === "META_GRAPH_TIMEOUT" ||
    attribution.enrichmentErrorCode === "META_GRAPH_408" ||
    attribution.enrichmentErrorCode === "META_GRAPH_429" ||
    attribution.enrichmentErrorCode?.startsWith("META_GRAPH_5")
  ) {
    return "Falha temporária; será reprocessado";
  }

  switch (attribution.enrichmentStatus) {
    case "PENDING":
      return "Aguardando processamento";
    case "PROCESSING":
      return "Processando origem";
    case "FAILED_PERMANENT":
      return "Detalhes indisponíveis";
    case "ENRICHED":
      return "Processamento concluído";
  }
}

export function hasAttributionEnrichmentIssue(
  attribution: LeadAttributionSummary | null | undefined,
): boolean {
  return Boolean(
    attribution &&
      (attribution.enrichmentStatus === "PENDING" ||
        attribution.enrichmentStatus === "PROCESSING" ||
        attribution.enrichmentStatus === "FAILED_PERMANENT" ||
        attribution.enrichmentErrorCode),
  );
}

export function isAttributionConfigurationIssue(
  attribution: LeadAttributionSummary | null | undefined,
): boolean {
  return Boolean(
    attribution &&
      CONFIGURATION_ENRICHMENT_ERRORS.has(
        attribution.enrichmentErrorCode ?? "",
      ),
  );
}

export function formatAttributionChannel(
  attribution: LeadAttributionSummary,
): string {
  if (attribution.channel === "LEAD_ADS") return "Lead Ads";
  if (attribution.channel === "WHATSAPP") return "WhatsApp";
  return attribution.provider === "META_LEAD_ADS" ? "Meta Lead Ads" : "Meta";
}
