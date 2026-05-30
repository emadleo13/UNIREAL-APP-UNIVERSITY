'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AuthPage() {
  const t = useTranslations('Auth');
  const tNav = useTranslations('Nav');
  const { user, signIn, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="p-6 text-center">
          <p className="text-slate-700">
            {user.name} · {user.email}
          </p>
          <Button className="mt-4" variant="secondary" onClick={signOut}>
            {tNav('signOut')}
          </Button>
        </Card>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    signIn(email, name);
    router.push('/universities');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-slate-900">{t('signInTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('verifiedHint')}</p>

        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={() => signIn('demo@gmail.com', 'Demo User')}
        >
          {t('continueWithGoogle')}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          {t('or')}
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name')}
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            required
          />
          <Button type="submit" className="w-full">
            {t('signInButton')}
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-400">{t('demoNotice')}</p>
      </Card>
    </div>
  );
}
