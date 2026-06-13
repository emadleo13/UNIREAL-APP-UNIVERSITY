'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthContext';
import { submitLead } from '@/app/lead-actions';

type Status = 'idle' | 'sending' | 'ok' | 'duplicate' | 'error' | 'consent';

/**
 * "Request info" lead form on university pages. Open to guests and members;
 * GDPR consent is required before the lead is stored.
 */
export function LeadForm({
  universityId,
  universityName,
}: {
  universityId: string;
  universityName: string;
}) {
  const t = useTranslations('Lead');
  const locale = useLocale();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('');
  const [field, setField] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  // Prefill from the signed-in account (auth state loads async).
  useEffect(() => {
    if (!user) return;
    setName((v) => v || user.name || '');
    setEmail((v) => v || user.email || '');
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setStatus('consent');
      return;
    }
    setStatus('sending');
    const res = await submitLead({
      universityId,
      name,
      email,
      studyLevel: level || undefined,
      fieldOfStudy: field || undefined,
      countryOfResidence: country || undefined,
      message: message || undefined,
      consent,
      locale,
    });
    setStatus(
      res.status === 'ok'
        ? 'ok'
        : res.status === 'duplicate'
          ? 'duplicate'
          : 'error'
    );
  };

  if (status === 'ok') {
    return (
      <Card className="mt-6 border-primary/30 p-5">
        <h2 className="font-semibold text-foreground">{t('title', { name: universityName })}</h2>
        <p className="mt-2 text-sm text-primary">{t('success')}</p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-primary/30 p-5">
      <h2 className="font-semibold text-foreground">
        {t('title', { name: universityName })}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('body')}</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t('name')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={t('email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t('level')}>
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">—</option>
              <option value="bachelor">{t('levelBachelor')}</option>
              <option value="master">{t('levelMaster')}</option>
              <option value="phd">{t('levelPhd')}</option>
              <option value="other">{t('levelOther')}</option>
            </Select>
          </FormField>
          <FormField label={t('country')}>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </FormField>
        </div>
        <FormField label={t('field')}>
          <Input value={field} onChange={(e) => setField(e.target.value)} />
        </FormField>
        <FormField label={t('message')}>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
        </FormField>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (status === 'consent') setStatus('idle');
            }}
            className="mt-0.5 h-4 w-4 flex-none accent-[var(--primary,#b45309)]"
          />
          <span>{t('consent')}</span>
        </label>

        {status === 'consent' && (
          <p className="text-sm text-destructive">{t('consentRequired')}</p>
        )}
        {status === 'duplicate' && (
          <p className="text-sm text-primary">{t('duplicate')}</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-destructive">{t('error')}</p>
        )}

        <Button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
