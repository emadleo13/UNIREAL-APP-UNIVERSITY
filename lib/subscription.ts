import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type MySubscription = {
  status: string;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
};

const ACTIVE = ['active', 'trialing'];

/** The signed-in user's subscription (or null when free / signed out). */
export async function getMySubscription(): Promise<MySubscription | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    status: data.status,
    plan: data.plan ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    isActive: ACTIVE.includes(data.status),
  };
}
