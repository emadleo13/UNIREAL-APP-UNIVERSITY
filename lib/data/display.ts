import type { University } from './types';

/** Localized university name with sensible fallback to the base English name. */
export function universityName(uni: University, locale: string): string {
  const i18n = uni.names_i18n;
  if (i18n) {
    const localized = i18n[locale as keyof typeof i18n];
    if (localized) return localized;
  }
  return uni.name;
}
