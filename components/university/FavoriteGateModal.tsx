'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FREE_FAVORITES_LIMIT, GUEST_FAVORITES_LIMIT } from '@/lib/limits';
import type { FavoriteGate } from '@/lib/favorites/FavoritesContext';

/**
 * Conversion funnel for saving universities:
 *  - guests hit GUEST_FAVORITES_LIMIT → invited to create a verified account;
 *  - free accounts hit FREE_FAVORITES_LIMIT → invited to UNIREAL Pro.
 * Browsing/search/reviews stay open to everyone (SEO priority).
 */
export function FavoriteGateModal({
  gate,
  onClose,
}: {
  gate: FavoriteGate;
  onClose: () => void;
}) {
  const t = useTranslations('Favorites');
  if (!gate) return null;

  const isSignup = gate === 'signup';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-foreground">
          {isSignup ? t('gateSignupTitle') : t('gateProTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isSignup
            ? t('gateSignupBody', {
                guestLimit: GUEST_FAVORITES_LIMIT,
                freeLimit: FREE_FAVORITES_LIMIT,
              })
            : t('gateProBody', { freeLimit: FREE_FAVORITES_LIMIT })}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/auth" onClick={onClose}>
            <Button className="w-full">
              {isSignup ? t('gateSignupCta') : t('gateProCta')}
            </Button>
          </Link>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {t('gateLater')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
