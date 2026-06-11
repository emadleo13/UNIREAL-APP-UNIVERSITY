import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isEmailConfigured, sendDeadlineReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Days before an application deadline at which we email the reminder. */
const REMINDER_WINDOW_DAYS = 7;

/**
 * Daily cron (configured in vercel.json). For every saved university whose
 * application deadline falls within the window, emails the owner of the
 * favorite once per deadline (favorites.reminded_deadline tracks the last
 * deadline we emailed about, so a changed deadline triggers a new reminder).
 *
 * Deadline reminders are an account perk: guests' favorites live in
 * localStorage only, so signing up is what unlocks these emails.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    url.searchParams.get('secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'email not configured' }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: favs, error } = await admin
    .from('favorites')
    .select('user_id, university_id, reminded_deadline, universities(slug, name, admission)')
    .limit(5000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Item = { name: string; slug: string; deadline: string; universityId: string };
  const byUser = new Map<string, Item[]>();
  for (const f of favs ?? []) {
    // supabase-js types embedded relations as arrays; it's a single row here.
    const uni = Array.isArray(f.universities) ? f.universities[0] : f.universities;
    const deadline: string | undefined = uni?.admission?.deadline;
    if (!deadline || deadline <= today || deadline > until) continue;
    if (f.reminded_deadline === deadline) continue;
    const list = byUser.get(f.user_id) ?? [];
    list.push({
      name: uni.name,
      slug: uni.slug,
      deadline,
      universityId: f.university_id,
    });
    byUser.set(f.user_id, list);
  }

  let sent = 0;
  for (const [userId, items] of byUser) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle();
    if (!profile?.email) continue;

    try {
      await sendDeadlineReminderEmail({
        to: profile.email,
        name: profile.name,
        items,
      });
      for (const it of items) {
        await admin
          .from('favorites')
          .update({ reminded_deadline: it.deadline })
          .eq('user_id', userId)
          .eq('university_id', it.universityId);
      }
      sent++;
    } catch (e) {
      console.error('deadline reminder failed for', userId, e);
    }
  }

  return NextResponse.json({
    ok: true,
    favoritesChecked: favs?.length ?? 0,
    usersEmailed: sent,
  });
}
