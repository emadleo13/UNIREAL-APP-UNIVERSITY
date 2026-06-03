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
  University,
} from '../types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a DB universities row (snake_case) to the app University model. */
function toUniversity(r: any): University {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    names_i18n: r.names_i18n ?? undefined,
    country: r.country,
    countryCode: r.country_code,
    city: r.city ?? undefined,
    region: r.region ?? undefined,
    website: r.website ?? undefined,
    domains: r.domains ?? [],
    geo: r.geo ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    establishedYear: r.established_year ?? undefined,
    rorId: r.ror_id ?? undefined,
    wikidataId: r.wikidata_id ?? undefined,
    openAlexId: r.openalex_id ?? undefined,
    ranking: r.ranking ?? undefined,
    researchScore: r.research_score ?? undefined,
    tuition: r.tuition ?? undefined,
    admissionRate: r.admission_rate ?? undefined,
    size: r.size ?? undefined,
    description_i18n: r.description_i18n ?? undefined,
    programsCount: r.programs_count ?? undefined,
    programs: r.programs ?? undefined,
    admission: r.admission ?? undefined,
    internationalUrl: r.international_url ?? undefined,
    international: r.international ?? undefined,
    awards: r.awards ?? undefined,
    medals: r.medals ?? undefined,
    eliteStudents: r.elite_students ?? undefined,
    updatedAt: r.updated_at ?? undefined,
    source: r.source ?? [],
  };
}

function toReview(r: any): Review {
  return {
    id: r.id,
    universityId: r.university_id,
    authorName: r.author_name,
    rating: r.rating,
    body: r.body,
    verified: r.verified,
    createdAt: r.created_at,
    source: r.source ?? undefined,
    sourceUrl: r.source_url ?? undefined,
  };
}

function toQuestion(r: any): Question {
  return {
    id: r.id,
    universityId: r.university_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
    answers: (r.answers ?? [])
      .map((a: any) => ({
        id: a.id,
        authorName: a.author_name,
        body: a.body,
        verified: a.verified,
        createdAt: a.created_at,
      }))
      .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export const supabaseRepository: DataRepository = {
  async listUniversities(
    opts: ListUniversitiesOptions = {}
  ): Promise<Paginated<University>> {
    const { q, country, minScore, maxTuition, sort = 'score', page = 1, pageSize = 24 } =
      opts;
    const supabase = await createSupabaseServerClient();
    let query = supabase.from('universities').select('*', { count: 'exact' });

    if (country) query = query.eq('country', country);
    if (q && q.trim()) query = query.ilike('name', `%${q.trim()}%`);
    if (minScore != null) query = query.gte('research_score', minScore);
    if (maxTuition != null) {
      query = query.not('tuition', 'is', null).lte('tuition', maxTuition);
    }

    switch (sort) {
      case 'ranking':
        query = query.order('ranking', { ascending: true, nullsFirst: false });
        break;
      case 'tuition':
        query = query.order('tuition', { ascending: true, nullsFirst: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('research_score', { ascending: false, nullsFirst: false });
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return {
      items: (data ?? []).map(toUniversity),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async getUniversityBySlug(slug: string): Promise<University | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data ? toUniversity(data) : null;
  },

  async saveUniversityFresh(slug, data): Promise<void> {
    // Service-role write — bypasses RLS (universities is read-only to clients).
    const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
    const admin = createSupabaseAdminClient();
    const row: Record<string, unknown> = {};
    if (data.description_i18n) row.description_i18n = data.description_i18n;
    if (data.programsCount != null) row.programs_count = data.programsCount;
    if (data.programs) row.programs = data.programs;
    if (data.tuition != null) row.tuition = data.tuition;
    if (data.admission) row.admission = data.admission;
    if (data.internationalUrl) row.international_url = data.internationalUrl;
    if (data.international) row.international = data.international;
    if (data.updatedAt) row.updated_at = data.updatedAt;
    if (Object.keys(row).length === 0) return;
    await admin.from('universities').update(row).eq('slug', slug);
  },

  async listCountries(): Promise<string[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('distinct_countries');
    if (error) throw error;
    return (data ?? []).map((r: any) => r.country ?? r).filter(Boolean).sort();
  },

  async listAdmissionEvents(): Promise<AdmissionEvent[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('universities')
      .select('slug, name, admission, international')
      .or('admission->>deadline.not.is.null,international->>deadline.not.is.null');
    if (error) throw error;
    const events: AdmissionEvent[] = [];
    for (const u of data ?? []) {
      if (u.admission?.deadline) {
        events.push({
          date: u.admission.deadline,
          universitySlug: u.slug,
          universityName: u.name,
          kind: 'domestic',
        });
      }
      if (u.international?.deadline) {
        events.push({
          date: u.international.deadline,
          universitySlug: u.slug,
          universityName: u.name,
          kind: 'international',
        });
      }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  },

  async listReviews(universityId: string): Promise<Review[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toReview);
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be signed in to review.');

    const { data: verified } = await supabase.rpc('is_verified_for_university', {
      p_email: user.email,
      p_university_id: input.universityId,
    });

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        university_id: input.universityId,
        author_id: user.id,
        author_name: input.authorName,
        rating: Math.max(1, Math.min(5, input.rating)),
        body: input.body,
        verified: Boolean(verified),
        source: 'UNIREAL',
      })
      .select('*')
      .single();
    if (error) throw error;
    return toReview(data);
  },

  async listQuestions(universityId: string): Promise<Question[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toQuestion);
  },

  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be signed in to ask a question.');

    const { data, error } = await supabase
      .from('questions')
      .insert({
        university_id: input.universityId,
        author_id: user.id,
        author_name: input.authorName,
        body: input.body,
      })
      .select('*, answers(*)')
      .single();
    if (error) throw error;
    return toQuestion(data);
  },

  async createAnswer(input: CreateAnswerInput): Promise<Question> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be signed in to answer.');

    const { data: q } = await supabase
      .from('questions')
      .select('university_id')
      .eq('id', input.questionId)
      .single();

    const { data: verified } = q
      ? await supabase.rpc('is_verified_for_university', {
          p_email: user.email,
          p_university_id: q.university_id,
        })
      : { data: false };

    const { error } = await supabase.from('answers').insert({
      question_id: input.questionId,
      author_id: user.id,
      author_name: input.authorName,
      body: input.body,
      verified: Boolean(verified),
    });
    if (error) throw error;

    const { data, error: qErr } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('id', input.questionId)
      .single();
    if (qErr) throw qErr;
    return toQuestion(data);
  },
};
