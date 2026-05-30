import universitiesData from '@/data/universities.json';
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
import { isVerifiedForUniversity } from '../verify';

const universities = universitiesData as unknown as University[];
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
    return bySlug.get(slug) ?? null;
  },

  async listCountries(): Promise<string[]> {
    return Array.from(new Set(universities.map((u) => u.country))).sort();
  },

  async listReviews(universityId: string): Promise<Review[]> {
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

function seedDemoContent(): void {
  const first = universities[0];
  if (!first) return;

  reviewsByUni.set(first.id, [
    {
      id: 'rev_seed1',
      universityId: first.id,
      authorName: 'Alex',
      rating: 5,
      body: 'Incredible research opportunities and a beautiful campus. Highly recommend.',
      verified: true,
      createdAt: '2026-04-10T10:00:00.000Z',
    },
    {
      id: 'rev_seed2',
      universityId: first.id,
      authorName: 'Maria',
      rating: 4,
      body: 'Great academics, though cost of living nearby is high.',
      verified: false,
      createdAt: '2026-03-22T09:00:00.000Z',
    },
  ]);

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
