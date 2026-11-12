import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LANGUAGES, translations, TranslationKey } from '../lib/i18n';

interface AccessibilityContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fraudshield_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_lang') as Language;
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  // Apply theme & high contrast classes to root html element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.removeAttribute('data-theme');
      }

      if (highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      localStorage.setItem('fraudshield_theme_mode', theme);
      localStorage.setItem('fraudshield_high_contrast', String(highContrast));
    }
  }, [theme, highContrast]);

  // Persist language selection
  useEffect(() => {
    try {
      localStorage.setItem('fraudshield_lang', language);
      document.documentElement.setAttribute('lang', language);
    } catch {}
  }, [language]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations.en;
    return (langDict as any)[key] || translations.en[key] || key;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        highContrast,
        setHighContrast,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
