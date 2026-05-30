import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UniversityCard } from '@/components/university/UniversityCard';
import { repo } from '@/lib/data';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  const { items: featured } = await repo.listUniversities({ page: 1, pageSize: 6 });

  const features = [
    { title: t('feature1Title'), body: t('feature1Body') },
    { title: t('feature2Title'), body: t('feature2Body') },
    { title: t('feature3Title'), body: t('feature3Body') },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/universities">
              <Button size="lg">{t('ctaExplore')}</Button>
            </Link>
            <Link href="/universities">
              <Button size="lg" variant="secondary">
                {t('ctaAsk')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900">{t('featuresTitle')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      </section>
    </div>
  );
}
