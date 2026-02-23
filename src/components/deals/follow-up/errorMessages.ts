/**
 * Mapeia mensagens de erro da API para mensagens amigáveis ao usuário
 */
export function getFollowUpErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Deal not found":
      "Negócio não encontrado. Recarregue a página e tente novamente.",
    "Scheduled time must be in the future":
      "A data e hora agendada devem ser no futuro.",
    "Follow-up already scheduled for this time":
      "Já existe um agendamento nesta mesma data e hora. Escolha outro horário.",
    "Invalid recurrence configuration":
      "Configuração de recorrência inválida. Verifique os dados e tente novamente.",
    "Recurrence end date must be in the future":
      "A data de término da recorrência deve ser no futuro.",
    "Failed to upload media file":
      "Falha ao enviar o arquivo. Verifique o tamanho (máx. 10 MB) e tente novamente.",
  };

  // Procura por uma correspondência exata
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // Se contiver 'upload', trata como erro de upload
  if (errorMessage.toLowerCase().includes("upload")) {
    return "Falha ao enviar o arquivo. Verifique o tamanho (máx. 10 MB) e tente novamente.";
  }

  // Mensagem padrão
  return "Falha ao criar agendamento. Tente novamente ou contate o suporte.";
}
