'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { SubscribeButton } from '@/components/billing/SubscribeButton';
import { ManageBillingButton } from '@/components/billing/ManageBillingButton';
import { fetchMySubscription } from '@/app/billing-actions';
import type { MySubscription } from '@/lib/subscription';

export default function AuthPage() {
  const t = useTranslations('Auth');
  const tNav = useTranslations('Nav');
  const { user, configured, signInWithPassword, signUp, signInWithGoogle, signOut } =
    useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sub, setSub] = useState<MySubscription | null>(null);

  useEffect(() => {
    if (user && configured) {
      fetchMySubscription().then(setSub);
    }
  }, [user, configured]);

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="p-6 text-center">
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {user.email}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">{t('plan')}:</span>
            {sub?.isActive ? (
              <Badge tone="green">{t('proPlan')}</Badge>
            ) : (
              <Badge tone="muted">{t('freePlan')}</Badge>
            )}
          </div>
          {sub?.currentPeriodEnd && sub.isActive && (
            <p className="mt-1 text-xs text-muted-foreground">
              {sub.cancelAtPeriodEnd ? t('endsOn') : t('renewsOn')}:{' '}
              {new Date(sub.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          <div className="mt-5 flex flex-col items-center gap-2">
            {sub?.isActive ? (
              <ManageBillingButton label={t('manageBilling')} />
            ) : (
              <SubscribeButton label={t('upgradePro')} size="md" />
            )}
            <Button variant="ghost" onClick={() => signOut()}>
              {tNav('signOut')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || (configured && !password)) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res =
        mode === 'signup'
          ? await signUp(email, password, name)
          : await signInWithPassword(email, password);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (mode === 'signup' && configured) {
        setInfo(t('checkEmail'));
        return;
      }
      router.push('/universities');
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-foreground">
          {mode === 'signup' ? t('signUpTitle') : t('signInTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('verifiedHint')}</p>

        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={() => signInWithGoogle()}
        >
          {t('continueWithGoogle')}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t('or')}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('name')}
            />
          )}
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            required
          />
          {configured && (
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              required
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {mode === 'signup' ? t('signUpButton') : t('signInButton')}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setInfo(null);
          }}
          className="mt-4 text-sm text-primary hover:opacity-80"
        >
          {mode === 'signin' ? t('noAccount') : t('haveAccount')}
        </button>

        {!configured && (
          <p className="mt-4 text-xs text-muted-foreground">{t('demoNotice')}</p>
        )}
      </Card>
    </div>
  );
}
