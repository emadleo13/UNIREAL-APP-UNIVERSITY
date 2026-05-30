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
};

export function SearchFilters({ countries, initialQuery, initialCountry }: Props) {
  const t = useTranslations('Universities');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);

  function apply(nextQ: string, nextCountry: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextCountry) params.set('country', nextCountry);
    const qs = params.toString();
    router.push(qs ? `/universities?${qs}` : '/universities');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(q, country);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
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
          apply(q, e.target.value);
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
    </form>
  );
}
