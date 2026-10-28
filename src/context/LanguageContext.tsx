import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, translations } from '../data/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  countryCode: string | null;
  ipAddress: string | null;
  isDetecting: boolean;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user has previously set a manual override
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_user_lang') as Language | null;
      if (saved === 'vi' || saved === 'en') return saved;
      // Default to Vietnamese if browser is Vietnamese, otherwise start with English while IP is detected
      const browserLang = navigator.language?.toLowerCase() || '';
      return browserLang.startsWith('vi') ? 'vi' : 'en';
    }
    return 'vi';
  });

  const [countryCode, setCountryCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_detected_country');
    }
    return null;
  });

  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function detectCountryByIp() {
      setIsDetecting(true);
      const savedUserChoice = localStorage.getItem('app_user_lang');

      try {
        // Primary API: api.country.is (fast, free, CORS allowed)
        let detectedCountry = '';
        let detectedIp = '';

        try {
          const res = await fetch('https://api.country.is', { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            detectedCountry = data.country || '';
            detectedIp = data.ip || '';
          }
        } catch {
          // Fallback API: ipapi.co
          try {
            const resFallback = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
            if (resFallback.ok) {
              const dataFallback = await resFallback.json();
              detectedCountry = dataFallback.country_code || '';
              detectedIp = dataFallback.ip || '';
            }
          } catch {
            // Secondary fallback: ipwho.is
            const resWho = await fetch('https://ipwho.is/');
            if (resWho.ok) {
              const dataWho = await resWho.json();
              detectedCountry = dataWho.country_code || '';
              detectedIp = dataWho.ip || '';
            }
          }
        }

        if (isMounted) {
          if (detectedCountry) {
            setCountryCode(detectedCountry);
            setIpAddress(detectedIp);
            localStorage.setItem('app_detected_country', detectedCountry);

            // If user has not manually locked their choice:
            // Vietnam IP -> Vietnamese, Other Countries -> English
            if (!savedUserChoice) {
              if (detectedCountry.toUpperCase() === 'VN') {
                setLanguageState('vi');
              } else {
                setLanguageState('en');
              }
            }
          } else {
            // Fallback via navigator.language if all IP APIs are blocked
            if (!savedUserChoice) {
              const isVi = navigator.language?.toLowerCase().startsWith('vi');
              setLanguageState(isVi ? 'vi' : 'en');
            }
          }
        }
      } catch (err) {
        console.warn('IP Geolocation detection error:', err);
      } finally {
        if (isMounted) {
          setIsDetecting(false);
        }
      }
    }

    detectCountryByIp();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('app_user_lang', newLang);
  };

  const t = translations[language] || translations.vi;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        countryCode,
        ipAddress,
        isDetecting,
        t,
      }}
    >
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
