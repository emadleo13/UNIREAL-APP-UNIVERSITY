import type { DataRepository } from '../repository';
import type {
  CreateAnswerInput,
  CreateQuestionInput,
  CreateReviewInput,
  ListUniversitiesOptions,
  Paginated,
  Question,
  Review,
  University,
} from '../types';

/**
 * Supabase-backed repository. Skeleton only — wired up but not yet implemented.
 *
 * Activation steps (later):
 *  1. Create a Supabase project, run supabase/migrations/0001_init.sql.
 *  2. Seed the `universities` table from data/universities.json.
 *  3. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.
 *  4. Set NEXT_PUBLIC_DATA_SOURCE=supabase.
 *  5. Implement each method below with the supabase-js client (see lib/supabase.ts).
 */
export const supabaseRepository: DataRepository = {
  async listUniversities(
    _opts?: ListUniversitiesOptions
  ): Promise<Paginated<University>> {
    // TODO(supabase): select from `universities` with ilike(name) + eq(country) + range().
    throw new Error('SupabaseRepository.listUniversities not implemented yet.');
  },

  async getUniversityBySlug(_slug: string): Promise<University | null> {
    // TODO(supabase): select * from universities where slug = _slug single().
    throw new Error('SupabaseRepository.getUniversityBySlug not implemented yet.');
  },

  async listCountries(): Promise<string[]> {
    // TODO(supabase): select distinct country (or a materialized view).
    throw new Error('SupabaseRepository.listCountries not implemented yet.');
  },

  async listReviews(_universityId: string): Promise<Review[]> {
    // TODO(supabase): select from reviews where university_id = _universityId.
    throw new Error('SupabaseRepository.listReviews not implemented yet.');
  },

  async createReview(_input: CreateReviewInput): Promise<Review> {
    // TODO(supabase): insert into reviews; verified computed via RLS/RPC.
    throw new Error('SupabaseRepository.createReview not implemented yet.');
  },

  async listQuestions(_universityId: string): Promise<Question[]> {
    // TODO(supabase): select questions + nested answers.
    throw new Error('SupabaseRepository.listQuestions not implemented yet.');
  },

  async createQuestion(_input: CreateQuestionInput): Promise<Question> {
    // TODO(supabase): insert into questions.
    throw new Error('SupabaseRepository.createQuestion not implemented yet.');
  },

  async createAnswer(_input: CreateAnswerInput): Promise<Question> {
    // TODO(supabase): insert into answers; return parent question.
    throw new Error('SupabaseRepository.createAnswer not implemented yet.');
  },
};
