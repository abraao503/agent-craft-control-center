import { AgentLanguage } from "@/types/agent";
import type { TFunction } from "i18next";

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

export const getLanguageLabel = (
  code: AgentLanguage,
  translate: TFunction,
) => {
  if (code === "en-US") return translate("agent.english");
  if (code === "es-ES") return translate("agent.spanish");
  return translate("agent.portuguese");
};
