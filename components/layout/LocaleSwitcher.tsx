'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { locales, type Locale } from '@/lib/i18n/routing';

const labels: Record<Locale, string> = {
  en: 'EN',
  ro: 'RO',
  fa: 'فا',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          className={
            loc === locale
              ? 'bg-brand-600 px-2.5 py-1 font-semibold text-white'
              : 'bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50'
          }
        >
          {labels[loc]}
        </button>
      ))}
    </div>
  );
}
