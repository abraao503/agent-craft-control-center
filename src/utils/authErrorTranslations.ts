import i18n from "@/i18n/index";

/**
 * Traduções de mensagens de erro da API de autenticação
 */

export const authErrorTranslations: Record<string, string> = {
  // Erros de signup
  "User already exists":
    "Este email já está cadastrado. Por favor, faça login ou use outro email.",
  "Email already in use":
    "Este email já está em uso. Por favor, use outro email.",
  "Company already exists": "Uma empresa com este nome já existe.",
  "Invalid email": "Email inválido.",
  "Password too weak": "Senha muito fraca. Use no mínimo 8 caracteres.",

  // Erros de login
  "Invalid credentials": "Email ou senha incorretos.",
  "User not found": "Usuário não encontrado.",
  "Invalid password": "Senha incorreta.",

  // Erros genéricos
  Unauthorized: "Não autorizado. Faça login novamente.",
  Forbidden: "Você não tem permissão para acessar este recurso.",
  "Bad Request": "Dados inválidos. Verifique as informações e tente novamente.",

  // Erros de validação
  "Email must be a valid email": "Digite um email válido.",
  "Password must be at least 8 characters":
    "A senha deve ter no mínimo 8 caracteres.",
  "Name is required": "Nome é obrigatório.",
  "Email is required": "Email é obrigatório.",
  "Password is required": "Senha é obrigatória.",
};

const authErrorKeys: Record<string, string> = {
  "User already exists": "errors.userAlreadyExists",
  "Email already in use": "errors.emailInUse",
  "Company already exists": "errors.companyAlreadyExists",
  "Invalid email": "errors.invalidEmail",
  "Password too weak": "errors.weakPassword",
  "Invalid credentials": "errors.invalidCredentials",
  "User not found": "errors.userNotFound",
  "Invalid password": "errors.invalidPassword",
  Unauthorized: "errors.unauthorized",
  Forbidden: "errors.forbidden",
  "Bad Request": "errors.badRequest",
  "Email must be a valid email": "errors.validEmailRequired",
  "Password must be at least 8 characters": "errors.passwordMinRequired",
  "Name is required": "errors.nameRequired",
  "Email is required": "errors.emailRequired",
  "Password is required": "errors.passwordRequired",
};

/**
 * Traduz uma mensagem de erro da API para o idioma ativo da interface
 * @param errorMessage - Mensagem de erro em inglês vinda da API
 * @param fallback - Mensagem padrão caso não encontre tradução
 * @returns Mensagem traduzida ou a mensagem original se não houver tradução
 */
export function translateAuthError(
  errorMessage: string,
  fallback: string = "Ocorreu um erro. Tente novamente."
): string {
  const key = authErrorKeys[errorMessage];
  if (key) return i18n.t(key, { defaultValue: authErrorTranslations[errorMessage] });
  return errorMessage || fallback;
}
