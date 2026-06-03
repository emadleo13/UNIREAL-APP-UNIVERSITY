import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/i18n/navigation';
import { listPosts } from '@/lib/blog/data';

export const dynamic = 'force-dynamic';

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
        <p className="mt-8 text-muted-foreground">{t('empty')}</p>
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
