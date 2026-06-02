import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type AdminMember = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  status: string;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type AdminData = {
  stats: {
    members: number;
    active: number;
    expiringSoon: number;
    canceled: number;
  };
  members: AdminMember[];
  expiring: AdminMember[];
};

const EXPIRY_WINDOW_DAYS = 14;
const ACTIVE_STATUSES = ['active', 'trialing'];

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Aggregate everything the admin panel needs (service-role read, bypasses RLS). */
export async function getAdminData(): Promise<AdminData> {
  const supabase = createSupabaseAdminClient();

  const [{ data: profiles }, { data: subs }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*'),
  ]);

  const subByUser = new Map<string, any>((subs ?? []).map((s) => [s.user_id, s]));

  const members: AdminMember[] = (profiles ?? []).map((p: any) => {
    const s = subByUser.get(p.id);
    return {
      id: p.id,
      email: p.email,
      name: p.name ?? null,
      createdAt: p.created_at,
      status: s?.status ?? 'free',
      plan: s?.plan ?? null,
      currentPeriodEnd: s?.current_period_end ?? null,
      cancelAtPeriodEnd: s?.cancel_at_period_end ?? false,
    };
  });

  const now = Date.now();
  const windowMs = EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const expiring = members
    .filter(
      (m) =>
        ACTIVE_STATUSES.includes(m.status) &&
        m.currentPeriodEnd &&
        new Date(m.currentPeriodEnd).getTime() - now <= windowMs &&
        new Date(m.currentPeriodEnd).getTime() >= now
    )
    .sort((a, b) =>
      (a.currentPeriodEnd ?? '').localeCompare(b.currentPeriodEnd ?? '')
    );

  return {
    stats: {
      members: members.length,
      active: members.filter((m) => ACTIVE_STATUSES.includes(m.status)).length,
      expiringSoon: expiring.length,
      canceled: members.filter((m) => m.status === 'canceled' || m.status === 'expired')
        .length,
    },
    members,
    expiring,
  };
}
