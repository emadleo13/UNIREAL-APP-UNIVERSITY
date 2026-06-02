import type { University } from './types';

/**
 * UNIREAL Score — a single 0–100 number to help students compare universities.
 *
 * It is a weighted blend of the signals we can legally derive today
 * (international ranking + research activity) plus curated competition data
 * (awards, world-competition medals, elite students) when available. Each
 * component is normalised to 0–100 first, then combined by weight over only
 * the components that are actually present, so a university is never penalised
 * for missing a data source.
 *
 * NOTE: awards / medals / eliteStudents are only populated for a curated set of
 * universities for now; the rest score on ranking + research alone.
 */

export type ScoreComponent = {
  key: 'ranking' | 'research' | 'awards' | 'medals' | 'eliteStudents';
  /** Normalised 0–100 value. */
  value: number;
  weight: number;
};

export type UniversityScore = {
  /** Final 0–100 score. */
  total: number;
  components: ScoreComponent[];
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

/** Lower ranking number = better. Rank 1 → 100, 10 → ~75, 100 → ~50, 1000 → ~25. */
function rankingToScore(rank: number): number {
  if (rank <= 0) return 0;
  return clamp(100 - Math.log10(rank) * 25);
}

/** Counts (awards, medals, …) scaled logarithmically into 0–100. */
function countToScore(count: number, fullAt: number): number {
  if (count <= 0) return 0;
  return clamp((Math.log10(count + 1) / Math.log10(fullAt + 1)) * 100);
}

const WEIGHTS = {
  ranking: 0.3,
  research: 0.35,
  awards: 0.15,
  medals: 0.1,
  eliteStudents: 0.1,
} as const;

export function computeUniversityScore(uni: University): UniversityScore | null {
  const components: ScoreComponent[] = [];

  if (uni.ranking != null) {
    components.push({
      key: 'ranking',
      value: rankingToScore(uni.ranking),
      weight: WEIGHTS.ranking,
    });
  }
  if (uni.researchScore != null) {
    components.push({
      key: 'research',
      value: clamp(uni.researchScore),
      weight: WEIGHTS.research,
    });
  }
  if (uni.awards != null) {
    components.push({
      key: 'awards',
      value: countToScore(uni.awards, 200),
      weight: WEIGHTS.awards,
    });
  }
  if (uni.medals != null) {
    components.push({
      key: 'medals',
      value: countToScore(uni.medals, 100),
      weight: WEIGHTS.medals,
    });
  }
  if (uni.eliteStudents != null) {
    components.push({
      key: 'eliteStudents',
      value: countToScore(uni.eliteStudents, 500),
      weight: WEIGHTS.eliteStudents,
    });
  }

  if (components.length === 0) return null;

  const weightSum = components.reduce((s, c) => s + c.weight, 0);
  const total = components.reduce((s, c) => s + c.value * c.weight, 0) / weightSum;

  return { total: Math.round(total), components };
}
