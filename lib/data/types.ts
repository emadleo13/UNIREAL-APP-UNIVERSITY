/** Canonical data models shared across the whole app and the data pipeline. */

export type LocalizedNames = {
  en?: string;
  ro?: string;
  fa?: string;
};

export type DataSource =
  | 'hipolabs'
  | 'ror'
  | 'openalex'
  | 'scorecard'
  | 'wikidata';

export type University = {
  /** Stable id (we use the slug). */
  id: string;
  /** SEO-friendly unique slug, e.g. "stanford-university". */
  slug: string;
  /** English / base display name. */
  name: string;
  /** Localized names from OpenAlex / Wikidata. */
  names_i18n?: LocalizedNames;

  country: string;
  /** ISO 3166-1 alpha-2 (e.g. "US", "RO", "IR"). */
  countryCode: string;
  city?: string;
  region?: string;

  website?: string;
  /** Email/web domains — used for the "Verified" badge (email domain match). */
  domains: string[];

  geo?: { lat: number; lng: number };
  logoUrl?: string;
  establishedYear?: number;

  /** Canonical identifiers used to link sources together. */
  rorId?: string;
  wikidataId?: string;
  openAlexId?: string;

  /** Official ranking (optional — only with a clearly licensed source). */
  ranking?: number;
  /** Legal CC0 proxy derived from OpenAlex works/citations. */
  researchScore?: number;

  /** Yearly tuition amount, in the currency given by `tuitionCurrency`. */
  tuition?: number;
  /** Currency of `tuition`. AI enrichment uses EUR; legacy scorecard data is USD. */
  tuitionCurrency?: 'EUR' | 'USD';
  admissionRate?: number;
  size?: number;

  // --- Editorial / curated fields (overlay) -------------------------------
  /** Localized free-text description of the university. */
  description_i18n?: LocalizedNames;
  /** Number of degree programs / majors offered. */
  programsCount?: number;
  /** Sample of notable programs / majors / faculties. */
  programs?: string[];
  /** General (domestic) admission info. */
  admission?: AdmissionInfo;
  /** Direct URL to the university's international students section. */
  internationalUrl?: string;
  /** Admission facts that specifically matter to international students. */
  international?: InternationalInfo;

  // --- Scoring inputs (curated, optional) ---------------------------------
  /** Notable awards (e.g. Nobel/Fields/Turing affiliations). */
  awards?: number;
  /** Medals won in world student competitions (olympiads, ICPC, etc.). */
  medals?: number;
  /** Count of elite / medal-winning students. */
  eliteStudents?: number;

  /** When this record's editorial/AI-refreshed info was last updated (ISO). */
  updatedAt?: string;
  /** True once the AI live-data provider has refreshed this record. */
  aiEnriched?: boolean;

  /** Which sources contributed to this record. */
  source: DataSource[];
};

export type AdmissionInfo = {
  /** Human-readable admission window, e.g. "Sep 1 – Jan 5". */
  period?: string;
  /** Main application deadline as ISO date (YYYY-MM-DD) — used by the calendar. */
  deadline?: string;
};

export type InternationalInfo = {
  /** Admission window for international students. */
  admissionPeriod?: string;
  /** Application deadline for international students (ISO YYYY-MM-DD). */
  deadline?: string;
  /** Yearly tuition for international students (USD). */
  tuition?: number;
  /** Number of programs taught in an international language. */
  programsCount?: number;
  /** Languages of instruction available to international students. */
  languages?: string[];
};

/** Where an aggregated review originally came from. */
export type ReviewSource =
  | 'UNIREAL'
  | 'Google'
  | 'Reddit'
  | 'Niche'
  | 'StudentRoom'
  | 'Quora';

export type Review = {
  id: string;
  universityId: string;
  authorName: string;
  rating: number; // 1..5
  body: string;
  verified: boolean;
  createdAt: string; // ISO
  /** Origin of the review. Defaults to 'UNIREAL' (written on-site). */
  source?: ReviewSource;
  /** Link back to the original review on the source platform. */
  sourceUrl?: string;
};

export type Answer = {
  id: string;
  authorName: string;
  body: string;
  verified: boolean;
  createdAt: string;
};

export type Question = {
  id: string;
  universityId: string;
  authorName: string;
  body: string;
  answers: Answer[];
  createdAt: string;
};

/** An admission-related date surfaced on the calendar. */
export type AdmissionEvent = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  universitySlug: string;
  universityName: string;
  /** Domestic vs international application deadline. */
  kind: 'domestic' | 'international';
};

export type User = {
  id: string;
  email: string;
  name: string;
  /** University domains this user is verified against. */
  verifiedDomains: string[];
};

export type UniversitySort = 'score' | 'ranking' | 'tuition' | 'name';

export type ListUniversitiesOptions = {
  q?: string;
  country?: string;
  /** Restrict to a set of countries (e.g. an Eastern-Europe focus list). */
  countries?: string[];
  /** Minimum research/score proxy (0–100). */
  minScore?: number;
  /** Maximum yearly tuition (USD); only matches universities with tuition data. */
  maxTuition?: number;
  sort?: UniversitySort;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateReviewInput = {
  universityId: string;
  authorName: string;
  rating: number;
  body: string;
  /** Email used to decide the verified badge (optional). */
  authorEmail?: string;
};

export type CreateQuestionInput = {
  universityId: string;
  authorName: string;
  body: string;
  authorEmail?: string;
};

export type CreateAnswerInput = {
  questionId: string;
  authorName: string;
  body: string;
  authorEmail?: string;
};
