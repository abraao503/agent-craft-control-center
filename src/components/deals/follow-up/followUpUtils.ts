import { Recurrence } from "@/types/deal-follow-up";

const DAYS_OF_WEEK_LABELS = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda-feira" },
  { value: 2, label: "Ter", fullLabel: "Terça-feira" },
  { value: 3, label: "Qua", fullLabel: "Quarta-feira" },
  { value: 4, label: "Qui", fullLabel: "Quinta-feira" },
  { value: 5, label: "Sex", fullLabel: "Sexta-feira" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

const NTH_LABELS = [
  { value: 1, label: "1ª" },
  { value: 2, label: "2ª" },
  { value: 3, label: "3ª" },
  { value: 4, label: "4ª" },
  { value: 5, label: "5ª (última)" },
];

/**
 * Retorna uma descrição legível da recorrência para exibição
 */
export function getRecurrenceDescription(recurrence: Recurrence): string {
  const { frequency, interval } = recurrence;

  let base = "";
  if (interval === 1) {
    switch (frequency) {
      case "DAILY":
        base = "Todo dia";
        break;
      case "WEEKLY":
        base = "Toda semana";
        break;
      case "MONTHLY":
        base = "Todo mês";
        break;
    }
  } else {
    switch (frequency) {
      case "DAILY":
        base = `A cada ${interval} dias`;
        break;
      case "WEEKLY":
        base = `A cada ${interval} semanas`;
        break;
      case "MONTHLY":
        base = `A cada ${interval} meses`;
        break;
    }
  }

  // Weekly details
  if (frequency === "WEEKLY") {
    const dayNames = recurrence.rule.daysOfWeek
      .sort()
      .map((d) => DAYS_OF_WEEK_LABELS.find((dw) => dw.value === d)?.label ?? "")
      .filter(Boolean);
    base += ` (${dayNames.join(", ")})`;
  }

  // Monthly details
  if (frequency === "MONTHLY") {
    const { rule } = recurrence;
    switch (rule.type) {
      case "MONTHLY_DAY":
        base += ` (dia ${rule.day})`;
        break;
      case "MONTHLY_NTH_WEEKDAY": {
        const nth = NTH_LABELS.find((n) => n.value === rule.nth)?.label ?? "";
        const weekday =
          DAYS_OF_WEEK_LABELS.find((d) => d.value === rule.weekday)
            ?.fullLabel ?? "";
        base += ` (na ${nth} ${weekday})`;
        break;
      }
      case "MONTHLY_LAST_DAY":
        base += " (último dia)";
        break;
    }
  }

  if (recurrence.endAt) {
    const endDate = new Date(recurrence.endAt);
    base += ` até ${endDate.toLocaleDateString("pt-BR")}`;
  }

  return base;
}

/** Tamanho máximo para upload de mídia: 10 MB */
export const FOLLOW_UP_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tipos de arquivo aceitos para follow-up media */
export const FOLLOW_UP_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const FOLLOW_UP_ACCEPTED_AUDIO_TYPES = [
  "audio/mp3",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/aac",
];

export const FOLLOW_UP_ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Texto
  "text/plain",
  "text/csv",
];

export const FOLLOW_UP_ALL_ACCEPTED_TYPES = [
  ...FOLLOW_UP_ACCEPTED_IMAGE_TYPES,
  ...FOLLOW_UP_ACCEPTED_AUDIO_TYPES,
  ...FOLLOW_UP_ACCEPTED_DOCUMENT_TYPES,
];

export const FOLLOW_UP_ACCEPT_STRING =
  "image/jpeg,image/png,image/gif,image/webp,audio/mp3,audio/mpeg,audio/ogg,audio/wav,audio/aac,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

/** Extensões aceitas como fallback quando o MIME type não é detectado corretamente */
const FOLLOW_UP_ACCEPTED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp",
  "mp3", "ogg", "wav", "aac", "m4a",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
]);

/**
 * Verifica se o arquivo é válido pelo MIME type OU pela extensão (fallback).
 * Alguns SOs/navegadores não reportam o MIME correto para .xlsx, .pptx etc.
 */
function isFileTypeAccepted(file: File): boolean {
  if (FOLLOW_UP_ALL_ACCEPTED_TYPES.includes(file.type)) return true;

  // Fallback por extensão
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return FOLLOW_UP_ACCEPTED_EXTENSIONS.has(ext);
}

/**
 * Valida um arquivo para upload de mídia no follow-up
 */
export function validateFollowUpFile(
  file: File,
): { valid: true } | { valid: false; error: string } {
  if (file.size > FOLLOW_UP_MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `O arquivo excede o limite de 10 MB. Tamanho: ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
  }

  if (!isFileTypeAccepted(file)) {
    return {
      valid: false,
      error:
        "Tipo de arquivo não suportado. Envie imagens, áudios ou documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV).",
    };
  }

  return { valid: true };
}

/**
 * Retorna o tipo de mídia baseado no MIME type do arquivo
 */
export function getMediaTypeFromFile(
  file: File,
): "image" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}
