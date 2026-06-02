'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = {
  countries: string[];
  initialQuery: string;
  initialCountry: string;
  initialSort: string;
  initialMinScore: string;
  initialMaxTuition: string;
};

export function SearchFilters({
  countries,
  initialQuery,
  initialCountry,
  initialSort,
  initialMinScore,
  initialMaxTuition,
}: Props) {
  const t = useTranslations('Universities');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [sort, setSort] = useState(initialSort || 'score');
  const [minScore, setMinScore] = useState(initialMinScore);
  const [maxTuition, setMaxTuition] = useState(initialMaxTuition);

  function apply(next: Partial<Record<string, string>> = {}) {
    const values = { q, country, sort, minScore, maxTuition, ...next };
    const params = new URLSearchParams();
    if (values.q?.trim()) params.set('q', values.q.trim());
    if (values.country) params.set('country', values.country);
    if (values.sort && values.sort !== 'score') params.set('sort', values.sort);
    if (values.minScore) params.set('minScore', values.minScore);
    if (values.maxTuition) params.set('maxTuition', values.maxTuition);
    const qs = params.toString();
    router.push(qs ? `/universities?${qs}` : '/universities');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="sm:flex-1"
          aria-label={t('searchPlaceholder')}
        />
        <Select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            apply({ country: e.target.value });
          }}
          className="sm:w-56"
          aria-label={t('filterCountry')}
        >
          <option value="">{t('allCountries')}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Button type="submit" className="sm:w-auto">
          {tc('search')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            apply({ sort: e.target.value });
          }}
          className="sm:w-48"
          aria-label={t('sortLabel')}
        >
          <option value="score">{t('sortScore')}</option>
          <option value="ranking">{t('sortRanking')}</option>
          <option value="tuition">{t('sortTuition')}</option>
          <option value="name">{t('sortName')}</option>
        </Select>
        <Select
          value={minScore}
          onChange={(e) => {
            setMinScore(e.target.value);
            apply({ minScore: e.target.value });
          }}
          className="sm:w-48"
          aria-label={t('minScore')}
        >
          <option value="">{t('anyScore')}</option>
          <option value="60">{t('score60')}</option>
          <option value="75">{t('score75')}</option>
          <option value="90">{t('score90')}</option>
        </Select>
        <Select
          value={maxTuition}
          onChange={(e) => {
            setMaxTuition(e.target.value);
            apply({ maxTuition: e.target.value });
          }}
          className="sm:w-48"
          aria-label={t('maxTuition')}
        >
          <option value="">{t('anyTuition')}</option>
          <option value="10000">{t('tuition10k')}</option>
          <option value="30000">{t('tuition30k')}</option>
          <option value="50000">{t('tuition50k')}</option>
        </Select>
      </div>
    </form>
  );
}
