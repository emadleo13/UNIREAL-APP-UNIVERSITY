'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { createPortalSession } from '@/app/billing-actions';

export function ManageBillingButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await createPortalSession();
      if (res.url) window.location.href = res.url;
    });
  }

  return (
    <Button variant="secondary" onClick={onClick} disabled={pending}>
      {label}
    </Button>
  );
}
