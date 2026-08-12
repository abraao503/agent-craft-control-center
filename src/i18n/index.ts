import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { esES, ptBR, resources } from "./resources";
import { es, ptBR as dateFnsPtBR } from "date-fns/locale";

export const SUPPORTED_LOCALES = ["pt-BR", "es-ES"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = "7agentes.locale";

const isSupportedLocale = (value: string | null): value is SupportedLocale =>
  value === "pt-BR" || value === "es-ES";

const getBrowserPreferredLocale = (): SupportedLocale => {
  const browserLocales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  // Keep the browser's preference order, falling back to Portuguese when none
  // of the supported languages is available. This is only used when no saved
  // choice exists yet.
  for (const browserLocale of browserLocales) {
    const normalizedLocale = browserLocale.trim().toLowerCase().replace("_", "-");
    if (normalizedLocale === "es" || normalizedLocale.startsWith("es-")) {
      return "es-ES";
    }
    if (normalizedLocale === "pt" || normalizedLocale.startsWith("pt-")) {
      return "pt-BR";
    }
  }

  return "pt-BR";
};

export const getInitialLocale = (): SupportedLocale => {
  if (typeof window === "undefined") return "pt-BR";

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(storedLocale)) return storedLocale;

  return getBrowserPreferredLocale();
};

const initialLocale = getInitialLocale();

// A large part of the existing UI imports date-fns' ptBR object directly.
// Keep those imports reactive while screens are migrated to formatters.ts.
const dateFnsOriginals = new Map<string, unknown>();
for (const key of ["formatDistance", "formatLong", "formatRelative", "localize", "match", "options"]) {
  dateFnsOriginals.set(key, (dateFnsPtBR as unknown as Record<string, unknown>)[key]);
  Object.defineProperty(dateFnsPtBR, key, {
    configurable: true,
    enumerable: true,
    get: () => i18n.language === "es-ES"
      ? (es as unknown as Record<string, unknown>)[key]
      : dateFnsOriginals.get(key),
  });
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: "pt-BR",
  supportedLngs: SUPPORTED_LOCALES,
  load: "currentOnly",
  nonExplicitSupportedLngs: false,
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export const setDocumentLocale = (locale: SupportedLocale) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
};

setDocumentLocale(initialLocale);

export const changeLocale = async (locale: SupportedLocale) => {
  if (locale === i18n.language) {
    setDocumentLocale(locale);
    return;
  }
  await i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
  setDocumentLocale(locale);
};

export const localeResources = { ptBR, esES };

export default i18n;
