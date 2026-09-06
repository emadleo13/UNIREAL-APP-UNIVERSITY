'use server';

import { repo } from '@/lib/data';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type {
  CreateAnswerInput,
  CreateQuestionInput,
  CreateReviewInput,
  Question,
  Review,
} from '@/lib/data/types';

/**
 * Server actions used by the client review/Q&A forms.
 *
 * A server action is a public HTTP endpoint: anything the form does in the
 * browser can be replayed with arbitrary arguments, so every rule the UI
 * implies has to be re-checked here. The forms cap nothing, so the caps live
 * here — an unbounded `body` is both a storage problem and an injection
 * surface, since reviews are rendered into the university page's JSON-LD
 * graph (see `jsonLdScript`).
 */

const MAX_BODY = 2000;
const MAX_NAME = 80;

/** Trim, drop control characters, and cap length. Returns null when empty. */
function sanitize(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const clean = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
  return clean.length > 0 ? clean : null;
}

/** Throws unless a signed-in user is making the request. */
async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  // Signed in, but still capped — an account is free, so it is not a limit.
  if (!(await checkRateLimit('community', user.id))) {
    throw new Error('Too many posts. Please try again later.');
  }
  return user;
}

/**
 * The display name always comes from the account, never from the request:
 * it is rendered next to a "verified" badge, so a client-supplied value would
 * let anyone post as the university itself.
 */
function displayName(user: { email?: string; user_metadata?: { name?: string } }) {
  return (
    sanitize(user.user_metadata?.name, MAX_NAME) ??
    sanitize(user.email?.split('@')[0], MAX_NAME) ??
    'Anonymous'
  );
}

export async function addReview(input: CreateReviewInput): Promise<Review[]> {
  const user = await requireUser();
  const universityId = sanitize(input.universityId, 200);
  const body = sanitize(input.body, MAX_BODY);
  if (!universityId || !body) throw new Error('Invalid review.');

  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('Invalid rating.');
  }

  await repo.createReview({
    universityId,
    authorName: displayName(user),
    rating,
    body,
    authorEmail: user.email,
  });
  return repo.listReviews(universityId);
}

export async function addQuestion(
  input: CreateQuestionInput
): Promise<Question[]> {
  const user = await requireUser();
  const universityId = sanitize(input.universityId, 200);
  const body = sanitize(input.body, MAX_BODY);
  if (!universityId || !body) throw new Error('Invalid question.');

  await repo.createQuestion({
    universityId,
    authorName: displayName(user),
    body,
  });
  return repo.listQuestions(universityId);
}

export async function addAnswer(
  input: CreateAnswerInput,
  universityId: string
): Promise<Question[]> {
  const user = await requireUser();
  const uniId = sanitize(universityId, 200);
  const questionId = sanitize(input.questionId, 200);
  const body = sanitize(input.body, MAX_BODY);
  if (!uniId || !questionId || !body) throw new Error('Invalid answer.');

  await repo.createAnswer({
    questionId,
    authorName: displayName(user),
    body,
  });
  return repo.listQuestions(uniId);
}
