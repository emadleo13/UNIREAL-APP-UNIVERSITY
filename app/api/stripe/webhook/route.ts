import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig ?? '', secret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  async function upsertFromSubscription(sub: Stripe.Subscription, userId?: string) {
    // Stripe moved `current_period_end` from the subscription onto each
    // subscription item in newer API versions — fall back to the item.
    const periodEnd = ((sub as any).current_period_end ??
      (sub.items.data[0] as any)?.current_period_end) as number | undefined;
    const plan = sub.items.data[0]?.price.nickname ?? 'pro';
    const row: Record<string, unknown> = {
      status: mapStripeStatus(sub.status),
      plan,
      stripe_subscription_id: sub.id,
      stripe_customer_id: String(sub.customer),
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      // new period → allow the expiry email to fire again
      expiry_notified_at: null,
      updated_at: new Date().toISOString(),
    };
    if (userId) row.user_id = userId;

    if (userId) {
      await admin.from('subscriptions').upsert(row, { onConflict: 'user_id' });
    } else {
      await admin
        .from('subscriptions')
        .update(row)
        .eq('stripe_customer_id', String(sub.customer));
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ?? session.metadata?.user_id ?? undefined;
        if (session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            String(session.subscription)
          );
          await upsertFromSubscription(sub, userId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id ?? undefined;
        await upsertFromSubscription(sub, userId);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
    return NextResponse.json({ error: 'handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
