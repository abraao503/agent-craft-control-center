/**
 * Mapeia mensagens de erro da API para mensagens amigáveis ao usuário
 */
export function getFollowUpErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Deal not found":
      "Negócio não encontrado. Recarregue a página e tente novamente.",
    "Follow-up not found":
      "Agendamento não encontrado. Recarregue a página e tente novamente.",
    "Scheduled time must be in the future":
      "A data e hora agendada devem ser no futuro.",
    "Follow-up already scheduled for this time":
      "Já existe um agendamento nesta mesma data e hora. Escolha outro horário.",
    "Invalid recurrence configuration":
      "Configuração de recorrência inválida. Verifique os dados e tente novamente.",
    "Recurrence end date must be in the future":
      "A data de término da recorrência deve ser no futuro.",
    "Cannot update completed or cancelled follow-up":
      "Não é possível editar um agendamento concluído, cancelado ou com falha.",
    "WhatsApp integration not configured for this pipeline":
      "A integração WhatsApp não está configurada para este pipeline.",
    "Customer does not have a phone number":
      "O cliente não possui número de telefone cadastrado.",
    "Failed to create follow-up":
      "Falha ao criar agendamento. Tente novamente ou contate o suporte.",
    "Failed to update follow-up":
      "Falha ao atualizar agendamento. Tente novamente ou contate o suporte.",
    "Failed to delete follow-up":
      "Falha ao excluir agendamento. Tente novamente ou contate o suporte.",
    "Failed to list follow-up occurrences":
      "Falha ao carregar histórico de envios. Tente novamente.",
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
