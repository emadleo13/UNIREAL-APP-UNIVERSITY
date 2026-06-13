'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Input';
import { UniversityCard } from '@/components/university/UniversityCard';
import { STUDY_COUNTRIES, countryName } from '@/lib/data/countries';
import { STUDY_FIELDS, fieldName } from '@/lib/data/fields';
import { matchUniversities } from '@/app/quiz-actions';
import type { University } from '@/lib/data/types';

const BUDGETS = [2000, 3500, 5000, 8000];

export function QuizForm() {
  const t = useTranslations('Quiz');
  const locale = useLocale();

  const [field, setField] = useState('');
  const [country, setCountry] = useState('');
  const [budget, setBudget] = useState('');
  const [results, setResults] = useState<University[] | null>(null);
  const [searching, setSearching] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    const matches = await matchUniversities({
      fieldSlug: field || undefined,
      countrySlug: country || undefined,
      maxTuition: budget ? Number(budget) : undefined,
    });
    setResults(matches);
    setSearching(false);
  };

  return (
    <div>
      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <FormField label={t('fieldLabel')}>
            <Select value={field} onChange={(e) => setField(e.target.value)}>
              <option value="">{t('anyField')}</option>
              {STUDY_FIELDS.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {fieldName(f, locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t('countryLabel')}>
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t('anyCountry')}</option>
              {STUDY_COUNTRIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {countryName(c, locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t('budgetLabel')}>
            <Select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="">{t('budgetAny')}</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  ≤ €{b.toLocaleString(locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="sm:col-span-3">
            <Button type="submit" disabled={searching}>
              {searching ? t('searching') : t('submit')}
            </Button>
          </div>
        </form>
      </Card>

      {results !== null && (
        <div className="mt-8">
          {results.length === 0 ? (
            <Card>
              <EmptyState
                icon={
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                }
                title={t('noResults')}
              />
            </Card>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {t('resultsTitle', { count: results.length })}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('saveHint')}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {results.map((u) => (
                  <UniversityCard key={u.id} university={u} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
