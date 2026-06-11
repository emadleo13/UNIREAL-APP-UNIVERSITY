'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { isEmailConfigured, sendLeadNotificationEmail } from '@/lib/email';

export type LeadInput = {
  universityId: string;
  name: string;
  email: string;
  studyLevel?: string;
  fieldOfStudy?: string;
  countryOfResidence?: string;
  message?: string;
  consent: boolean;
  locale?: string;
};

export type LeadResult = {
  status: 'ok' | 'duplicate' | 'invalid' | 'error';
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LEVELS = new Set(['bachelor', 'master', 'phd', 'other']);

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s.length > 0 ? s : null;
};

/**
 * Store a "request info" lead for a university. GDPR: requires explicit
 * consent; rows are service-role only (RLS with no policies) and deduped
 * per (email, university).
 */
export async function submitLead(input: LeadInput): Promise<LeadResult> {
  try {
    if (!isSupabaseConfigured()) return { status: 'error' };

    const name = clean(input.name, 120);
    const email = clean(input.email, 200)?.toLowerCase() ?? null;
    const universityId = clean(input.universityId, 200);
    if (!name || !email || !EMAIL_RE.test(email) || !universityId) {
      return { status: 'invalid' };
    }
    if (input.consent !== true) return { status: 'invalid' };

    const admin = createSupabaseAdminClient();
    const { data: uni } = await admin
      .from('universities')
      .select('id, name')
      .eq('id', universityId)
      .maybeSingle();
    if (!uni) return { status: 'invalid' };

    // Attach the user id when signed in (optional — guests can submit too).
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      /* guest */
    }

    const studyLevel = clean(input.studyLevel, 20);
    const row = {
      university_id: uni.id,
      user_id: userId,
      name,
      email,
      study_level: studyLevel && LEVELS.has(studyLevel) ? studyLevel : null,
      field_of_study: clean(input.fieldOfStudy, 200),
      country_of_residence: clean(input.countryOfResidence, 100),
      message: clean(input.message, 1000),
      consent: true,
      locale: clean(input.locale, 10),
    };

    const { error } = await admin.from('leads').insert(row);
    if (error) {
      if (error.code === '23505') return { status: 'duplicate' };
      console.error('submitLead insert failed:', error);
      return { status: 'error' };
    }

    // Heads-up to the owner; never blocks the user's success response.
    if (isEmailConfigured()) {
      sendLeadNotificationEmail({
        universityName: uni.name,
        ...row,
      }).catch((e) => console.error('lead notification email failed:', e));
    }

    return { status: 'ok' };
  } catch (e) {
    console.error('submitLead failed:', e);
    return { status: 'error' };
  }
}
