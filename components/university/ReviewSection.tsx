'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Stars } from '@/components/ui/Stars';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { addReview } from '@/app/actions';
import type { Review, ReviewSource } from '@/lib/data/types';

function SourceBadge({
  source,
  url,
  t,
}: {
  source: ReviewSource;
  url?: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const badge = <Badge tone="muted">{t('viaSource', { source })}</Badge>;
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
      {badge}
    </a>
  ) : (
    badge
  );
}

export function ReviewSection({
  universityId,
  initialReviews,
}: {
  universityId: string;
  initialReviews: Review[];
}) {
  const t = useTranslations('Reviews');
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const authorName = user?.name || name || 'Anonymous';
    startTransition(async () => {
      const next = await addReview({
        universityId,
        authorName,
        rating,
        body: body.trim(),
        authorEmail: user?.email,
      });
      setReviews(next);
      setBody('');
      setName('');
      setRating(5);
    });
  }

  return (
    <section id="reviews" className="scroll-mt-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={avg} />
            <span>{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{t('aggregatedNotice')}</p>

      <Card className="mt-4 p-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('rating')}:</span>
            <Stars value={rating} onChange={setRating} />
          </div>
          {!user && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
            />
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('bodyPlaceholder')}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('demoNotice')}</p>
            <Button type="submit" disabled={pending}>
              {t('submit')}
            </Button>
          </div>
        </form>
      </Card>

      <ul className="mt-4 space-y-3">
        {reviews.length === 0 && (
          <li className="text-sm text-muted-foreground">{t('empty')}</li>
        )}
        {reviews.map((r) => (
          <li key={r.id}>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{r.authorName}</span>
                  {r.verified && <VerifiedBadge label="✓" />}
                  {r.source && r.source !== 'UNIREAL' && (
                    <SourceBadge source={r.source} url={r.sourceUrl} t={t} />
                  )}
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
