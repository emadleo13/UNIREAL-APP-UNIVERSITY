import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'ro', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Locales that render right-to-left. */
export const rtlLocales: Locale[] = ['fa'];

export function dirForLocale(locale: string): 'rtl' | 'ltr' {
  return rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
