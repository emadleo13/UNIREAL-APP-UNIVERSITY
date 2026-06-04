'use client';

import { useTransition } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/AuthContext';
import { createCheckoutSession } from '@/app/billing-actions';

export function SubscribeButton({
  label,
  size = 'lg',
}: {
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!user) {
      router.push('/auth');
      return;
    }
    startTransition(async () => {
      const res = await createCheckoutSession();
      if (res.url) {
        window.location.href = res.url;
      } else if (res.error === 'config') {
        // Stripe not wired yet — fall back to the account page.
        router.push('/auth');
      } else if (res.error === 'auth') {
        router.push('/auth');
      } else {
        // Surface the real failure instead of silently doing nothing.
        alert(res.message || 'Could not start checkout. Please try again.');
      }
    });
  }

  return (
    <Button size={size} onClick={onClick} disabled={pending}>
      {label}
    </Button>
  );
}
