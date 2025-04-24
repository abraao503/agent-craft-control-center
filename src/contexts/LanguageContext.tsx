
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ptBR } from '@/locales/pt-BR';
import { enUS } from '@/locales/en-US';

type LanguageContextType = {
  language: string;
  t: (key: string) => string;
  changeLanguage: (lang: string) => void;
};

type TranslationsType = {
  [key: string]: string;
};

type LanguageProviderProps = {
  children: ReactNode;
};

const translations: { [key: string]: TranslationsType } = {
  'pt-BR': ptBR,
  'en-US': enUS
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en-US';
  });

  const t = (key: string): string => {
    const currentTranslations = translations[language] || enUS;
    return currentTranslations[key] || key;
  };

  const changeLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
