export function metaTemplateSyncError(error: unknown): string {
  const code = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  switch (code) {
    case "META_MANUAL_TOKEN_UNAVAILABLE":
      return "As credenciais da conta estão indisponíveis ou expiraram. Atualize as credenciais e tente novamente.";
    case "META_MANUAL_ACCOUNT_NOT_FOUND":
      return "Configure a conta Meta da empresa antes de sincronizar os modelos.";
    case "INTEGRATION_NOT_FOUND":
      return "Conecte um número Meta a este canal ou funil antes de sincronizar os modelos.";
    case "WORKSPACE_NOT_FOUND":
      return "Este ambiente está indisponível para seu usuário.";
    case "FEATURE_DISABLED":
    case "GRAPH_NOT_CONFIGURED":
      return "A integração Meta ainda não foi configurada para esta empresa.";
    default:
      return "Não foi possível sincronizar os modelos com a Meta. Tente novamente em instantes.";
  }
}
