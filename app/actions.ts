'use server';

import { repo } from '@/lib/data';
import type {
  CreateAnswerInput,
  CreateQuestionInput,
  CreateReviewInput,
  Question,
  Review,
} from '@/lib/data/types';

/**
 * Server actions used by the client review/Q&A forms. In mock mode these mutate
 * the in-memory store on the running server (demo). TODO(supabase): these will
 * insert into Supabase tables once the Supabase repository is implemented.
 */
export async function addReview(input: CreateReviewInput): Promise<Review[]> {
  await repo.createReview(input);
  return repo.listReviews(input.universityId);
}

export async function addQuestion(
  input: CreateQuestionInput
): Promise<Question[]> {
  await repo.createQuestion(input);
  return repo.listQuestions(input.universityId);
}

export async function addAnswer(
  input: CreateAnswerInput,
  universityId: string
): Promise<Question[]> {
  await repo.createAnswer(input);
  return repo.listQuestions(universityId);
}
