const MESSAGE_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aceita",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
  PENDING: "Pendente",
  PLAYED: "Reproduzida",
  PROCESSING: "Processando",
  QUEUED: "Na fila",
  READ: "Lida",
  RECEIVED: "Recebida",
  SENT: "Enviada",
  UNKNOWN: "Desconhecido",
};

export const OPERATIONAL_PROVIDER_LABELS: Record<string, string> = {
  "meta-cloud": "Meta Cloud",
  "z-api": "Z-API",
  evolux: "Evolux",
};

export function formatOperationalMessageStatus(
  status?: string | null,
): string {
  if (!status) return "Status não informado";

  return (
    MESSAGE_STATUS_LABELS[status.toUpperCase()] ?? "Status desconhecido"
  );
}
