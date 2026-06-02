import universitiesData from '@/data/universities.json';
import detailsData from '@/data/university-details.json';
import type { DataRepository } from '../repository';
import type {
  AdmissionEvent,
  CreateAnswerInput,
  CreateQuestionInput,
  CreateReviewInput,
  ListUniversitiesOptions,
  Paginated,
  Question,
  Review,
  ReviewSource,
  University,
} from '../types';
import { isVerifiedForUniversity } from '../verify';
import { fetchAggregatedReviews, fetchFreshUniversityInfo } from '../ai-provider';

/** One curated review as stored in the details overlay (no id/universityId). */
type ExternalReviewSeed = {
  authorName: string;
  rating: number;
  body: string;
  source: ReviewSource;
  sourceUrl?: string;
  createdAt: string;
  verified?: boolean;
};

/** A curated overlay entry: extra University fields + sample external reviews. */
type OverlayEntry = Partial<University> & { externalReviews?: ExternalReviewSeed[] };

/**
 * Date the curated overlay was last reviewed. Once the AI live-data provider is
 * wired up, `updatedAt` will instead come from each fresh fetch.
 */
const CURATED_UPDATED_AT = '2026-05-20';

const overlay = detailsData as unknown as Record<string, OverlayEntry>;

const baseUniversities = universitiesData as unknown as University[];

/** Merge curated overlay fields (description, admission, scoring inputs, …). */
function withOverlay(uni: University): University {
  const entry = overlay[uni.slug];
  if (!entry) return uni;
  const { externalReviews: _drop, ...fields } = entry;
  return {
    ...uni,
    ...fields,
    updatedAt: fields.updatedAt ?? CURATED_UPDATED_AT,
  };
}

const universities = baseUniversities.map(withOverlay);
const bySlug = new Map(universities.map((u) => [u.slug, u]));
const byId = new Map(universities.map((u) => [u.id, u]));

/**
 * In-memory stores for write operations. This is DEMO behaviour only — it resets
 * on every server reload. Real persistence arrives with the Supabase repository.
 * TODO(supabase): replace all mutations below with table inserts.
 */
const reviewsByUni = new Map<string, Review[]>();
const questionsByUni = new Map<string, Question[]>();
const questionsById = new Map<string, Question>();

seedExternalReviews();
seedDemoContent();

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const mockRepository: DataRepository = {
  async listUniversities(
    opts: ListUniversitiesOptions = {}
  ): Promise<Paginated<University>> {
    const { q, country, page = 1, pageSize = 24 } = opts;
    let items = universities;

    if (country) {
      items = items.filter((u) => u.country === country);
    }
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter((u) => {
        const names = [u.name, u.names_i18n?.en, u.names_i18n?.fa, u.names_i18n?.ro];
        return names.some((n) => n?.toLowerCase().includes(needle));
      });
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  },

  async getUniversityBySlug(slug: string): Promise<University | null> {
    const uni = bySlug.get(slug);
    if (!uni) return null;
    // Prefer fresh AI data when available; fall back to the curated overlay.
    const fresh = await fetchFreshUniversityInfo(uni);
    if (fresh) {
      return { ...uni, ...fresh, aiEnriched: true, updatedAt: fresh.updatedAt };
    }
    return uni;
  },

  async listCountries(): Promise<string[]> {
    return Array.from(new Set(universities.map((u) => u.country))).sort();
  },

  async listAdmissionEvents(): Promise<AdmissionEvent[]> {
    const events: AdmissionEvent[] = [];
    for (const uni of universities) {
      if (uni.admission?.deadline) {
        events.push({
          date: uni.admission.deadline,
          universitySlug: uni.slug,
          universityName: uni.name,
          kind: 'domestic',
        });
      }
      if (uni.international?.deadline) {
        events.push({
          date: uni.international.deadline,
          universitySlug: uni.slug,
          universityName: uni.name,
          kind: 'international',
        });
      }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  },

  async listReviews(universityId: string): Promise<Review[]> {
    const uni = byId.get(universityId);
    // Prefer fresh AI-aggregated reviews when available.
    if (uni) {
      const fresh = await fetchAggregatedReviews(uni);
      if (fresh) return fresh;
    }
    return [...(reviewsByUni.get(universityId) ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    const uni = byId.get(input.universityId);
    const review: Review = {
      id: uid('rev'),
      universityId: input.universityId,
      authorName: input.authorName,
      rating: Math.max(1, Math.min(5, input.rating)),
      body: input.body,
      verified: uni
        ? isVerifiedForUniversity(input.authorEmail, uni)
        : false,
      createdAt: new Date().toISOString(),
      source: 'UNIREAL',
    };
    const list = reviewsByUni.get(input.universityId) ?? [];
    list.push(review);
    reviewsByUni.set(input.universityId, list);
    return review;
  },

  async listQuestions(universityId: string): Promise<Question[]> {
    return [...(questionsByUni.get(universityId) ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const uni = byId.get(input.universityId);
    const question: Question = {
      id: uid('q'),
      universityId: input.universityId,
      authorName: input.authorName,
      body: input.body,
      answers: [],
      createdAt: new Date().toISOString(),
    };
    void uni; // verification applies to answers/reviews; question authorship kept simple
    const list = questionsByUni.get(input.universityId) ?? [];
    list.push(question);
    questionsByUni.set(input.universityId, list);
    questionsById.set(question.id, question);
    return question;
  },

  async createAnswer(input: CreateAnswerInput): Promise<Question> {
    const question = questionsById.get(input.questionId);
    if (!question) {
      throw new Error(`Question not found: ${input.questionId}`);
    }
    const uni = byId.get(question.universityId);
    question.answers.push({
      id: uid('a'),
      authorName: input.authorName,
      body: input.body,
      verified: uni ? isVerifiedForUniversity(input.authorEmail, uni) : false,
      createdAt: new Date().toISOString(),
    });
    return question;
  },
};

/** Seed the curated multi-source sample reviews from the overlay. */
function seedExternalReviews(): void {
  for (const [slug, entry] of Object.entries(overlay)) {
    if (!entry.externalReviews?.length) continue;
    const uni = bySlug.get(slug);
    if (!uni) continue;
    const seeded: Review[] = entry.externalReviews.map((r, i) => ({
      id: `ext_${slug}_${i}`,
      universityId: uni.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      verified: r.verified ?? false,
      createdAt: r.createdAt,
      source: r.source,
      sourceUrl: r.sourceUrl,
    }));
    reviewsByUni.set(uni.id, seeded);
  }
}

function seedDemoContent(): void {
  const first = universities[0];
  if (!first) return;

  const q: Question = {
    id: 'q_seed1',
    universityId: first.id,
    authorName: 'Sam',
    body: 'How is the support for international students?',
    answers: [
      {
        id: 'a_seed1',
        authorName: 'Faculty Member',
        body: 'There is a dedicated international office with orientation and visa help.',
        verified: true,
        createdAt: '2026-04-12T12:00:00.000Z',
      },
    ],
    createdAt: '2026-04-11T08:00:00.000Z',
  };
  questionsByUni.set(first.id, [q]);
  questionsById.set(q.id, q);
}
