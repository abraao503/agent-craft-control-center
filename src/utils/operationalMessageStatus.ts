const MESSAGE_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aceita",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
  PENDING: "Pendente",
  PROCESSING: "Processando",
  QUEUED: "Na fila",
  READ: "Lida",
  SENT: "Enviada",
};

export function formatOperationalMessageStatus(
  status?: string | null,
): string {
  if (!status) return "Status não informado";

  return (
    MESSAGE_STATUS_LABELS[status.toUpperCase()] ?? "Status desconhecido"
  );
}
