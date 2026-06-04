'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { getMySubscription, type MySubscription } from '@/lib/subscription';

/** Client-callable wrapper to read the current user's subscription. */
export async function fetchMySubscription(): Promise<MySubscription | null> {
  return getMySubscription();
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type ActionResult = {
  url?: string;
  error?: 'auth' | 'config' | 'unknown';
  message?: string;
};

/** Create a Stripe Checkout session for the signed-in user, return its URL. */
export async function createCheckoutSession(): Promise<ActionResult> {
  if (!isStripeConfigured()) return { error: 'config' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };

  try {
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    // Re-use an existing Stripe customer if we have one.
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from('subscriptions')
        .upsert(
          { user_id: user.id, stripe_customer_id: customerId, status: 'free' },
          { onConflict: 'user_id' }
        );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${SITE_URL}/?checkout=success`,
      cancel_url: `${SITE_URL}/?checkout=cancel`,
      metadata: { user_id: user.id },
    });

    return { url: session.url ?? undefined };
  } catch (e) {
    console.error('createCheckoutSession failed:', e);
    return {
      error: 'unknown',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Create a Stripe Billing Portal session so users can manage their plan. */
export async function createPortalSession(): Promise<ActionResult> {
  if (!isStripeConfigured()) return { error: 'config' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };

  try {
    const admin = createSupabaseAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: 'unknown' };

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${SITE_URL}/auth`,
    });
    return { url: session.url };
  } catch (e) {
    console.error('createPortalSession failed:', e);
    return { error: 'unknown' };
  }
}
