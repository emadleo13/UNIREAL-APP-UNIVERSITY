import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { RobotMascot } from '@/components/chat/RobotMascot';
import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
  SUPPORT_TELEGRAM,
  SUPPORT_TELEGRAM_URL,
} from '@/lib/contact';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href={SUPPORT_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <Card className="flex h-full items-start gap-3 p-5 transition-all hover:border-primary hover:shadow-md">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.83 1.27-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.93.46l.33-4.72L18.6 6.1c.37-.33-.08-.51-.58-.18L7.45 12.7l-4.6-1.44c-1-.31-1.02-1 .21-1.48L20.65 3.2c.83-.31 1.56.2 1.29 1.4Z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary">
                {t('telegram')}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                @{SUPPORT_TELEGRAM}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('telegramNote')}</p>
            </div>
          </Card>
        </a>

        <a href={SUPPORT_EMAIL_URL} className="group block">
          <Card className="flex h-full items-start gap-3 p-5 transition-all hover:border-primary hover:shadow-md">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground group-hover:text-primary">
                {t('email')}
              </p>
              <p className="mt-0.5 break-all text-sm text-muted-foreground" dir="ltr">
                {SUPPORT_EMAIL}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('emailNote')}</p>
            </div>
          </Card>
        </a>
      </div>

      <Card className="mt-4 border-primary/30 p-5">
        <h2 className="font-semibold text-foreground">{t('subscriberTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('subscriberNote')}</p>
      </Card>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <RobotMascot className="h-8 w-8" />
          <h2 className="text-xl font-bold text-foreground">{t('chatTitle')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t('chatSubtitle')}</p>
        <Card className="mt-3 overflow-hidden">
          <ChatPanel variant="page" />
        </Card>
      </section>
    </div>
  );
}
