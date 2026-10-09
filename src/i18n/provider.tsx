import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { setActiveLanguage, translate, type Language, type TranslationKey, type TranslationValues } from './messages';

const LANGUAGE_KEY = 'tamakoro.language.v1';
export type LanguagePreference = 'system' | Language;
type I18nContextValue = { language: Language; preference: LanguagePreference;
  setPreference: (value: LanguagePreference) => Promise<boolean>;
  t: (key: TranslationKey, values?: TranslationValues) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

function systemLanguage(languageCode?: string | null): Language {
  return languageCode?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [deviceLanguage, setDeviceLanguage] = useState<Language>(() => systemLanguage(getLocales()[0]?.languageCode));
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');
  const preferenceWrite = useRef(0);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LANGUAGE_KEY).then(value => {
      if (active && preferenceWrite.current === 0 && (value === 'system' || value === 'fr' || value === 'en')) setPreferenceState(value);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setDeviceLanguage(systemLanguage(getLocales()[0]?.languageCode));
    });
    return () => subscription.remove();
  }, []);
  const language = preference === 'system' ? deviceLanguage : preference;
  setActiveLanguage(language);
  const setPreference = useCallback(async (value: LanguagePreference) => {
    const writeVersion = ++preferenceWrite.current;
    const previous = preference;
    setPreferenceState(value);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, value);
      return true;
    } catch {
      if (preferenceWrite.current === writeVersion) setPreferenceState(previous);
      return false;
    }
  }, [preference]);
  const t = useCallback((key: TranslationKey, values?: TranslationValues) => translate(key, values, language), [language]);
  const value = useMemo(() => ({ language, preference, setPreference, t }), [language, preference, setPreference, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n doit être utilisé dans I18nProvider.');
  return context;
}
