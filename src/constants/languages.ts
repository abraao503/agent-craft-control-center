import { AgentLanguage } from "@/types/agent";

type Language = {
  code: AgentLanguage;
  name: string;
};

export const LANGUAGES: Language[] = [
  {
    code: "en-US",
    name: "Inglês",
  },
  {
    code: "es-ES",
    name: "Espanhol",
  },
  {
    code: "pt-BR",
    name: "Português",
  },
];
