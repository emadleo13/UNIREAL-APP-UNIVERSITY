import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/lib/i18n/navigation';
import { listPosts } from '@/lib/blog/data';
import { localeAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const title = t('title');
  const description = t('subtitle');
  return {
    title,
    description,
    alternates: localeAlternates('/blog', locale),
    openGraph: { title, description, type: 'website' },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Blog');
  const posts = await listPosts();

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>

      {posts.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5" />
              <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18h13a1.5 1.5 0 0 1 1.5 1.5v0a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z" />
              <path d="M8 8h8M8 11h8" />
            </svg>
          }
          title={t('empty')}
        />
      ) : (
        <div className="mt-6 space-y-4">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="block">
              <Card className="p-5 transition-all hover:border-primary hover:shadow-md">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.category && <Badge tone="primary">{p.category}</Badge>}
                  <span>{fmt(p.createdAt)}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-foreground">{p.title}</h2>
                {p.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
