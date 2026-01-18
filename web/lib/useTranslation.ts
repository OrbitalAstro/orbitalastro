import { translations, type Language } from './i18n'
import { useSettingsStore } from './store'

type Translation = typeof translations.en

const DEFAULT_LANGUAGE: Language = 'fr'

function normalizeLanguage(language: unknown): Language {
  if (language === 'en' || language === 'fr' || language === 'es') return language
  return DEFAULT_LANGUAGE
}

export function useTranslation(): Translation & { locale: Language } {
  const language = useSettingsStore((s) => s.language)
  const locale = normalizeLanguage(language)
  const t = (translations[locale] || translations[DEFAULT_LANGUAGE]) as Translation
  return { locale, ...t }
}
