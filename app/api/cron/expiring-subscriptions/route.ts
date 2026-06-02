import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isEmailConfigured, sendExpiryEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Days before period end at which we send the heads-up email. */
const NOTIFY_WINDOW_DAYS = 5;

/**
 * Daily cron (configured in vercel.json). Finds active subscriptions whose
 * period ends within the window and that haven't been emailed yet, sends the
 * reminder via Resend, and marks them notified so we never double-send.
 *
 * Protected by CRON_SECRET — Vercel Cron sends it automatically as a Bearer
 * token; you can also call it manually with ?secret=...
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
  const now = new Date();
  const until = new Date(now.getTime() + NOTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { data: subs, error } = await admin
    .from('subscriptions')
    .select('user_id, status, current_period_end, cancel_at_period_end, expiry_notified_at')
    .in('status', ['active', 'trialing'])
    .is('expiry_notified_at', null)
    .not('current_period_end', 'is', null)
    .lte('current_period_end', until.toISOString())
    .gte('current_period_end', now.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const s of subs ?? []) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, name')
      .eq('id', s.user_id)
      .maybeSingle();
    if (!profile?.email) continue;

    try {
      await sendExpiryEmail({
        to: profile.email,
        name: profile.name,
        periodEnd: s.current_period_end,
        cancelAtPeriodEnd: s.cancel_at_period_end,
      });
      await admin
        .from('subscriptions')
        .update({ expiry_notified_at: now.toISOString() })
        .eq('user_id', s.user_id);
      sent++;
    } catch (e) {
      console.error('expiry email failed for', s.user_id, e);
    }
  }

  return NextResponse.json({ ok: true, checked: subs?.length ?? 0, sent });
}
