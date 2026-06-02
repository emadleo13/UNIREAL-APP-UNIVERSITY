import 'server-only';
import { Resend } from 'resend';
import { SUPPORT_EMAIL, SUPPORT_TELEGRAM_URL } from './contact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const EMAIL_FROM = process.env.EMAIL_FROM || 'UNIREAL <onboarding@resend.dev>';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set.');
  return new Resend(key);
}

/** Notify a user that their UNIREAL Pro subscription is about to renew/expire. */
export async function sendExpiryEmail(opts: {
  to: string;
  name?: string | null;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  const { to, name, periodEnd, cancelAtPeriodEnd } = opts;
  const date = new Date(periodEnd).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const subject = cancelAtPeriodEnd
    ? 'Your UNIREAL Pro access ends soon'
    : 'Your UNIREAL Pro renews soon';
  const action = cancelAtPeriodEnd
    ? `Your UNIREAL Pro access will end on <strong>${date}</strong>. Renew anytime to keep always-fresh data, deadline reminders and aggregated reviews.`
    : `Your UNIREAL Pro subscription will renew on <strong>${date}</strong>. No action is needed — we just wanted to keep you in the loop.`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#4a3b33">
      <h2 style="color:#b45309">UNIREAL Pro</h2>
      <p>${greeting}</p>
      <p>${action}</p>
      <p style="margin:24px 0">
        <a href="${SITE_URL}/auth" style="background:#b45309;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
          Manage subscription
        </a>
      </p>
      <p style="font-size:13px;color:#78716c">
        Questions? Reach us on Telegram (${SUPPORT_TELEGRAM_URL}) or email ${SUPPORT_EMAIL}.
      </p>
    </div>`;

  await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}
