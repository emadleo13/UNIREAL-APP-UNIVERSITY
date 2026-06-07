import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { SUPPORT_EMAIL, SUPPORT_EMAIL_URL, SUPPORT_TELEGRAM_URL } from '@/lib/contact';
import { STUDY_COUNTRIES, countryName } from '@/lib/data/countries';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();
  const destinations = STUDY_COUNTRIES.slice(0, 6);
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-unireal.png"
              alt={t('Brand.name')}
              className="h-10 w-10 rounded-md object-contain dark:bg-white dark:p-0.5"
            />
            <span className="text-base font-semibold text-foreground">
              {t('Brand.name')}
            </span>
          </Link>
          <p className="mt-2">{t('Brand.tagline')}</p>
          <p className="mt-4">{t('Footer.dataCredit')}</p>
          <p className="mt-1">
            © {year} {t('Brand.name')}. {t('Footer.rights')}
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">
            {t('Footer.studyDestinations')}
          </p>
          <ul className="mt-2 space-y-1.5">
            {destinations.map((c) => (
              <li key={c.slug}>
                <Link href={`/study-in/${c.slug}`} className="hover:text-primary">
                  {countryName(c, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-foreground">{t('Nav.contact')}</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/contact" className="hover:text-primary">
                {t('Contact.title')}
              </Link>
            </li>
            <li>
              <a
                href={SUPPORT_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {t('Contact.telegram')}
              </a>
            </li>
            <li>
              <a href={SUPPORT_EMAIL_URL} className="break-all hover:text-primary" dir="ltr">
                {SUPPORT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
