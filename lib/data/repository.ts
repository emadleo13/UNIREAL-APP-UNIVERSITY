import type {
  AdmissionEvent,
  CreateAnswerInput,
  CreateQuestionInput,
  CreateReviewInput,
  ListUniversitiesOptions,
  Paginated,
  Question,
  Review,
  University,
} from './types';

/**
 * Single data access seam. The UI only ever talks to this interface, so we can
 * swap the mock implementation for Supabase without touching any component.
 */
export interface DataRepository {
  listUniversities(
    opts?: ListUniversitiesOptions
  ): Promise<Paginated<University>>;
  getUniversityBySlug(slug: string): Promise<University | null>;
  /** Persist AI-refreshed editorial fields (used by the on-view refresh). */
  saveUniversityFresh(slug: string, data: Partial<University>): Promise<void>;
  /** Distinct country list for the filter dropdown. */
  listCountries(): Promise<string[]>;

  /** Admission deadlines for the calendar (curated overlay data). */
  listAdmissionEvents(): Promise<AdmissionEvent[]>;

  listReviews(universityId: string): Promise<Review[]>;
  createReview(input: CreateReviewInput): Promise<Review>;

  listQuestions(universityId: string): Promise<Question[]>;
  createQuestion(input: CreateQuestionInput): Promise<Question>;
  createAnswer(input: CreateAnswerInput): Promise<Question>;
}
