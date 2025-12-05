
import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18n, initializeLanguage, setLanguage as saveLanguage, getCurrentLanguage } from '@/constants/i18n';

interface LanguageContextType {
  language: 'en' | 'es' | 'pt';
  setLanguage: (language: 'en' | 'es' | 'pt') => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'es' | 'pt'>('es');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeLanguage();
      setLanguageState(getCurrentLanguage());
      setIsInitialized(true);
    };
    init();
  }, []);

  const setLanguage = async (newLanguage: 'en' | 'es' | 'pt') => {
    await saveLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  if (!isInitialized) {
    return null; // or a loading screen
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
