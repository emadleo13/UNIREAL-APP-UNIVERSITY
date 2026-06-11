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

/** Remind a user about application deadlines on their saved universities. */
export async function sendDeadlineReminderEmail(opts: {
  to: string;
  name?: string | null;
  items: Array<{ name: string; slug: string; deadline: string }>;
}): Promise<void> {
  const { to, name, items } = opts;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const subject =
    items.length === 1
      ? `Application deadline approaching: ${items[0].name}`
      : `Application deadlines approaching for ${items.length} of your saved universities`;

  const rows = items
    .map((it) => {
      const date = new Date(it.deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `<li style="margin:6px 0">
        <a href="${SITE_URL}/universities/${it.slug}" style="color:#b45309;font-weight:600;text-decoration:none">${it.name}</a>
        — apply by <strong>${date}</strong>
      </li>`;
    })
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#4a3b33">
      <h2 style="color:#b45309">UNIREAL deadline reminder</h2>
      <p>${greeting}</p>
      <p>The application window is closing soon for ${
        items.length === 1 ? 'a university you saved' : 'universities you saved'
      }:</p>
      <ul style="padding-left:18px">${rows}</ul>
      <p style="margin:24px 0">
        <a href="${SITE_URL}/saved" style="background:#b45309;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
          View saved universities
        </a>
      </p>
      <p style="font-size:13px;color:#78716c">
        Questions? Reach us on Telegram (${SUPPORT_TELEGRAM_URL}) or email ${SUPPORT_EMAIL}.
      </p>
    </div>`;

  await getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}

/** Notify the site owner that a new "request info" lead came in. */
export async function sendLeadNotificationEmail(opts: {
  universityName: string;
  name: string;
  email: string;
  study_level: string | null;
  field_of_study: string | null;
  country_of_residence: string | null;
  message: string | null;
  locale: string | null;
}): Promise<void> {
  const fields: Array<[string, string | null]> = [
    ['University', opts.universityName],
    ['Name', opts.name],
    ['Email', opts.email],
    ['Study level', opts.study_level],
    ['Field of study', opts.field_of_study],
    ['Country of residence', opts.country_of_residence],
    ['Message', opts.message],
    ['Locale', opts.locale],
  ];
  const rows = fields
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#78716c">${k}</td><td style="padding:4px 0"><strong>${v}</strong></td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#4a3b33">
      <h2 style="color:#b45309">New lead on UNIREAL</h2>
      <table style="font-size:14px;border-collapse:collapse">${rows}</table>
    </div>`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: SUPPORT_EMAIL,
    subject: `New lead: ${opts.universityName}`,
    html,
  });
}
