import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{t('Brand.name')}</p>
        <p className="mt-1">{t('Brand.tagline')}</p>
        <p className="mt-4">{t('Footer.dataCredit')}</p>
        <p className="mt-1">
          © {year} {t('Brand.name')}. {t('Footer.rights')}
        </p>
      </div>
    </footer>
  );
}
