import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enTranslation from './locales/en/translation.json';
import ptTranslation from './locales/pt/translation.json';
import deTranslation from './locales/de/translation.json';
import daTranslation from './locales/da/translation.json';
import jaTranslation from './locales/ja/translation.json';
import zhTranslation from './locales/zh/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      pt: { translation: ptTranslation },
      de: { translation: deTranslation },
      da: { translation: daTranslation },
      ja: { translation: jaTranslation },
      zh: { translation: zhTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation }
    },
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    
    interpolation: {
      escapeValue: false
    },react: {useSuspence: false}
  });

if (typeof window !== 'undefined') {
  window.i18n = i18n;
}

export default i18n;