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

/** Localized description, falling back across locales (en → any available). */
export function universityDescription(
  uni: University,
  locale: string
): string | undefined {
  const i18n = uni.description_i18n;
  if (!i18n) return undefined;
  return (
    i18n[locale as keyof typeof i18n] ||
    i18n.en ||
    i18n.fa ||
    i18n.ro ||
    undefined
  );
}
