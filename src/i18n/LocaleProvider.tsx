import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { changeLocale, getInitialLocale, SupportedLocale } from "./index";
import i18n from "./index";

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        locale === "es-ES"
          ? "Automatiza ventas y atención con agentes de inteligencia artificial."
          : "Controle de agentes IA",
      );
    }
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute(
        "content",
        locale === "es-ES"
          ? "Automatiza ventas y atención con agentes de inteligencia artificial."
          : "Controle de agentes IA",
      );
    }
  }, [locale]);

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      if (nextLanguage === "pt-BR" || nextLanguage === "es-ES") {
        setLocaleState(nextLanguage);
      }
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: async (nextLocale) => {
        await changeLocale(nextLocale);
        setLocaleState(nextLocale);
      },
    }),
    [locale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={value}>
        <div key={locale} className="contents">
          {children}
        </div>
      </LocaleContext.Provider>
    </I18nextProvider>
  );
}

export function useAppLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useAppLocale must be used inside LocaleProvider");
  }
  return context;
}
