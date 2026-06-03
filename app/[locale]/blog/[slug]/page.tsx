import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/i18n/navigation';
import { getPost } from '@/lib/blog/data';

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Blog');
  const post = await getPost(slug);
  if (!post) notFound();

  const date = new Date(post.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/blog" className="text-sm font-medium text-primary hover:opacity-80">
        ← {t('back')}
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        {post.category && <Badge tone="primary">{post.category}</Badge>}
        <span>{date}</span>
      </div>
      <h1 className="mt-2 text-3xl font-bold text-foreground">{post.title}</h1>
      {post.summary && (
        <p className="mt-2 text-lg text-muted-foreground">{post.summary}</p>
      )}

      <div className="mt-6 whitespace-pre-line leading-relaxed text-foreground">
        {post.body}
      </div>

      {post.sourceUrl && (
        <p className="mt-8 border-t border-border pt-4 text-sm">
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80"
          >
            {t('source')} ↗
          </a>
        </p>
      )}
    </article>
  );
}
