import { useTranslation } from 'react-i18next';
import type { Language } from '../types';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  
  const language = i18n.language as Language;
  
  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
  };

  return { language, setLanguage, toggleLanguage };
};
