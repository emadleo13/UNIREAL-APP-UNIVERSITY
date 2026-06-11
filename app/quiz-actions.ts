'use server';

import { repo } from '@/lib/data';
import { STUDY_COUNTRIES, findStudyCountry } from '@/lib/data/countries';
import { findStudyField, universityMatchesField } from '@/lib/data/fields';
import type { University } from '@/lib/data/types';

export type QuizInput = {
  fieldSlug?: string;
  countrySlug?: string;
  /** Max yearly tuition in EUR; undefined = no limit. */
  maxTuition?: number;
};

/**
 * Match universities for the quiz: filter by destination country, field
 * keywords and budget, keep the score order from the repo. No AI cost —
 * pure filtering over already-enriched data.
 */
export async function matchUniversities(input: QuizInput): Promise<University[]> {
  try {
    const country = input.countrySlug ? findStudyCountry(input.countrySlug) : null;
    const field = input.fieldSlug ? findStudyField(input.fieldSlug) : null;
    const countries = country
      ? country.match
      : STUDY_COUNTRIES.flatMap((c) => c.match);

    const { items } = await repo.listUniversities({
      countries,
      sort: 'score',
      pageSize: 1000,
    });

    let matches = items;
    if (field) matches = matches.filter((u) => universityMatchesField(u, field));
    if (input.maxTuition != null && input.maxTuition > 0) {
      const max = input.maxTuition;
      matches = matches.filter((u) => u.tuition != null && u.tuition <= max);
    }
    return matches.slice(0, 12);
  } catch (e) {
    console.error('matchUniversities failed:', e);
    return [];
  }
}
