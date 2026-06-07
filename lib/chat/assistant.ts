import { SUPPORT_EMAIL, SUPPORT_TELEGRAM_URL } from '../contact';
import type { University } from '../data/types';
import { computeUniversityScore } from '../data/score';
import { universityName, universityDescription } from '../data/display';

/**
 * UNIREAL ASSISTANT (local brain — no external AI, no cost).
 * ------------------------------------------------------------------------
 * The assistant answers in two layers, both fully local:
 *   1. University lookup — if the message names a university (fuzzy-matched
 *      against the site's own database, see app/chat-actions.ts), we answer
 *      with that university's real data (score, tuition, deadlines, …).
 *   2. FAQ — otherwise a small localized keyword FAQ handles "how does X work"
 *      style questions. Only when neither matches do we show the contact
 *      fallback.
 *
 * The pure helpers here (answerFromFaq, buildUniversityAnswer, fallbackAnswer)
 * are orchestrated by the askAssistant server action, which owns the DB call.
 */

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

type Locale = 'en' | 'fa' | 'ro';

type FaqEntry = { keywords: string[]; answer: string };

const GREETING: Record<Locale, string> = {
  en: "Hi! I'm EMi, the UNIREAL assistant. Ask me about universities, reviews, scores, deadlines or your subscription.",
  fa: 'سلام! من EMi هستم، دستیار یونی‌ریل. درباره‌ی دانشگاه‌ها، نقدها، امتیازها، مهلت‌ها یا اشتراکت از من بپرس.',
  ro: 'Salut! Sunt EMi, asistentul UNIREAL. Întreabă-mă despre universități, recenzii, scoruri, termene sau abonament.',
};

const FALLBACK: Record<Locale, string> = {
  en: `I'm not sure about that yet — my full AI brain is coming soon. For anything urgent, contact support on Telegram (${SUPPORT_TELEGRAM_URL}) or email ${SUPPORT_EMAIL}.`,
  fa: `هنوز مطمئن نیستم — مغز کامل هوش مصنوعی‌ام به‌زودی فعال می‌شود. برای موارد فوری از تلگرام (${SUPPORT_TELEGRAM_URL}) یا ایمیل ${SUPPORT_EMAIL} با پشتیبانی تماس بگیر.`,
  ro: `Încă nu sunt sigur — creierul meu AI complet vine în curând. Pentru ceva urgent, contactează suportul pe Telegram (${SUPPORT_TELEGRAM_URL}) sau email ${SUPPORT_EMAIL}.`,
};

const FAQ: Record<Locale, FaqEntry[]> = {
  en: [
    { keywords: ['hello', 'hi', 'hey'], answer: GREETING.en },
    { keywords: ['what is', 'about unireal', 'who are you'], answer: 'UNIREAL helps you find the right university with real, verified student reviews, up-to-date facts and a UNIREAL Score for each university.' },
    { keywords: ['review', 'rating', 'opinion'], answer: 'Each university page shows reviews gathered from multiple sources, plus reviews written by verified students. Open a university and scroll to the Reviews section.' },
    { keywords: ['score', 'ranking', 'rank'], answer: 'The UNIREAL Score (0–100) blends international ranking, research activity, awards, competition medals and elite students. You can see the breakdown on each university page.' },
    { keywords: ['international', 'foreign', 'visa', 'abroad'], answer: 'On each university page the "For international students" card shows the admission period, tuition for international students, English-taught programs and a direct link to the university\'s international section.' },
    { keywords: ['tuition', 'cost', 'fee', 'price'], answer: 'Tuition is shown on each university page — both general and, where available, a separate figure for international students.' },
    { keywords: ['deadline', 'calendar', 'date', 'admission'], answer: 'The Calendar page shows today\'s date and admission deadlines (domestic and international). Open Calendar from the top menu.' },
    { keywords: ['subscribe', 'subscription', 'pro', 'pay', 'payment', 'price plan'], answer: 'UNIREAL is free to browse. UNIREAL Pro adds always-fresh AI-refreshed data, deadline reminders and aggregated reviews. You can subscribe from the home page.' },
    { keywords: ['contact', 'support', 'help', 'problem', 'refund'], answer: `You can reach support directly on Telegram (${SUPPORT_TELEGRAM_URL}) or by email at ${SUPPORT_EMAIL}. See the Contact page for the full support chat.` },
    { keywords: ['language', 'persian', 'farsi', 'romanian'], answer: 'UNIREAL is available in English, Persian (فارسی) and Romanian. Switch language from the menu in the top bar.' },
  ],
  fa: [
    { keywords: ['سلام', 'درود', 'های'], answer: GREETING.fa },
    { keywords: ['یونی‌ریل چیست', 'یونی ریل چیه', 'کی هستی', 'چیکار'], answer: 'یونی‌ریل کمکت می‌کند دانشگاه مناسب را با نقدهای واقعی و تأییدشده‌ی دانشجویان، اطلاعات به‌روز و یک امتیاز اختصاصی برای هر دانشگاه پیدا کنی.' },
    { keywords: ['نقد', 'نظر', 'امتیاز کاربر', 'ریویو'], answer: 'هر صفحه‌ی دانشگاه نقدهای گردآوری‌شده از منابع مختلف به‌علاوه‌ی نقدهای دانشجویان تأییدشده را نشان می‌دهد. وارد یک دانشگاه شو و به بخش نقدها برو.' },
    { keywords: ['امتیاز', 'رتبه', 'اسکور'], answer: 'امتیاز یونی‌ریل (۰ تا ۱۰۰) ترکیبی از رتبه‌ی بین‌المللی، فعالیت پژوهشی، جوایز، مدال‌های مسابقات و دانشجویان نخبه است. تفکیکش را در صفحه‌ی هر دانشگاه می‌بینی.' },
    { keywords: ['بین‌الملل', 'بین الملل', 'خارجی', 'ویزا', 'خارج'], answer: 'در صفحه‌ی هر دانشگاه، کارت «دانشجویان بین‌المللی» بازه‌ی پذیرش، شهریه‌ی دانشجوی خارجی، رشته‌های انگلیسی‌زبان و لینک مستقیم به بخش بین‌الملل دانشگاه را نشان می‌دهد.' },
    { keywords: ['شهریه', 'هزینه', 'قیمت'], answer: 'شهریه در صفحه‌ی هر دانشگاه نمایش داده می‌شود — هم عمومی و هم در صورت وجود، رقم جداگانه برای دانشجویان بین‌المللی.' },
    { keywords: ['مهلت', 'تقویم', 'تاریخ', 'پذیرش', 'زمان'], answer: 'صفحه‌ی تقویم تاریخ امروز و مهلت‌های پذیرش (داخلی و بین‌المللی) را نشان می‌دهد. از منوی بالا گزینه‌ی تقویم را باز کن.' },
    { keywords: ['اشتراک', 'پرو', 'پرداخت', 'سابسکرایب', 'پلن'], answer: 'مرور یونی‌ریل رایگان است. یونی‌ریل پرو داده‌های همیشه‌تازه‌ی هوش مصنوعی، یادآوری مهلت‌ها و نقدهای گردآوری‌شده را اضافه می‌کند. از صفحه‌ی اصلی می‌توانی اشتراک بگیری.' },
    { keywords: ['تماس', 'پشتیبانی', 'کمک', 'مشکل', 'بازگشت وجه'], answer: `می‌توانی مستقیم از تلگرام (${SUPPORT_TELEGRAM_URL}) یا ایمیل ${SUPPORT_EMAIL} با پشتیبانی تماس بگیری. برای چت کامل پشتیبانی به صفحه‌ی تماس با ما برو.` },
    { keywords: ['زبان', 'فارسی', 'انگلیسی', 'رومانیایی'], answer: 'یونی‌ریل به سه زبان انگلیسی، فارسی و رومانیایی در دسترس است. از منوی نوار بالا زبان را عوض کن.' },
  ],
  ro: [
    { keywords: ['salut', 'buna', 'bună'], answer: GREETING.ro },
    { keywords: ['ce este', 'despre unireal', 'cine ești'], answer: 'UNIREAL te ajută să găsești universitatea potrivită cu recenzii reale și verificate, informații actualizate și un Scor UNIREAL pentru fiecare universitate.' },
    { keywords: ['recenzie', 'recenzii', 'părere', 'opinie'], answer: 'Fiecare pagină de universitate arată recenzii adunate din mai multe surse, plus recenzii de la studenți verificați. Deschide o universitate și mergi la secțiunea Recenzii.' },
    { keywords: ['scor', 'clasament', 'rank'], answer: 'Scorul UNIREAL (0–100) combină clasamentul internațional, activitatea de cercetare, premiile, medaliile și studenții de elită. Vezi detalierea pe pagina fiecărei universități.' },
    { keywords: ['internațional', 'international', 'străin', 'viză', 'viza'], answer: 'Pe fiecare pagină, cardul „Pentru studenții internaționali" arată perioada de admitere, taxa pentru internaționali, programele în engleză și un link direct către secțiunea internațională a universității.' },
    { keywords: ['taxă', 'taxa', 'cost', 'preț'], answer: 'Taxa este afișată pe pagina fiecărei universități — atât generală, cât și, unde e disponibilă, o valoare separată pentru studenții internaționali.' },
    { keywords: ['termen', 'calendar', 'dată', 'data', 'admitere'], answer: 'Pagina Calendar arată data de azi și termenele de admitere (interne și internaționale). Deschide Calendar din meniul de sus.' },
    { keywords: ['abona', 'abonament', 'pro', 'plată', 'plata'], answer: 'UNIREAL e gratuit de explorat. UNIREAL Pro adaugă date mereu proaspete, mementouri pentru termene și recenzii agregate. Te poți abona din pagina principală.' },
    { keywords: ['contact', 'suport', 'ajutor', 'problemă', 'rambursare'], answer: `Poți contacta suportul direct pe Telegram (${SUPPORT_TELEGRAM_URL}) sau prin email la ${SUPPORT_EMAIL}. Vezi pagina Contact pentru chatul complet de suport.` },
    { keywords: ['limbă', 'limba', 'engleză', 'persană', 'română'], answer: 'UNIREAL este disponibil în engleză, persană și română. Schimbă limba din meniul din bara de sus.' },
  ],
};

function asLocale(locale: string): Locale {
  return locale === 'fa' || locale === 'ro' ? locale : 'en';
}

/** Returns the assistant's opening message for a locale. */
export function greeting(locale: string): string {
  return GREETING[asLocale(locale)];
}

/**
 * Match a message against the localized keyword FAQ. Returns null on no match
 * so the caller can try a university lookup / fallback instead.
 */
export function answerFromFaq(message: string, locale: string): string | null {
  const loc = asLocale(locale);
  const text = message.toLowerCase();
  for (const entry of FAQ[loc]) {
    if (entry.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return entry.answer;
    }
  }
  return null;
}

/** The contact fallback, shown only when nothing else matched. */
export function fallbackAnswer(locale: string): string {
  return FALLBACK[asLocale(locale)];
}

const UNI_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    score: 'UNIREAL Score',
    ranking: 'World ranking',
    tuition: 'Tuition',
    intlTuition: 'International tuition',
    intlDeadline: 'International deadline',
    languages: 'Languages of instruction',
    more: 'Full details, reviews and the score breakdown',
    pickHeader: 'Closest matches I found — open the right one:',
    notFound:
      "I couldn't find a university matching that. Try the full name, or browse them on the Universities page.",
  },
  fa: {
    score: 'امتیاز یونی‌ریل',
    ranking: 'رتبه‌ی جهانی',
    tuition: 'شهریه',
    intlTuition: 'شهریه‌ی دانشجوی بین‌المللی',
    intlDeadline: 'مهلت پذیرش بین‌المللی',
    languages: 'زبان‌های تدریس',
    more: 'جزئیات کامل، نقدها و تفکیک امتیاز',
    pickHeader: 'نزدیک‌ترین دانشگاه‌هایی که پیدا کردم — درست را باز کن:',
    notFound:
      'دانشگاهی با این نام پیدا نکردم. اسم کامل‌ترش را بنویس یا از صفحه‌ی دانشگاه‌ها مرور کن.',
  },
  ro: {
    score: 'Scor UNIREAL',
    ranking: 'Clasament mondial',
    tuition: 'Taxă',
    intlTuition: 'Taxă pentru internaționali',
    intlDeadline: 'Termen internațional',
    languages: 'Limbi de predare',
    more: 'Detalii complete, recenzii și detalierea scorului',
    pickHeader: 'Cele mai apropiate universități găsite — deschide-o pe cea corectă:',
    notFound:
      'Nu am găsit o universitate cu acest nume. Încearcă numele complet sau caut-o în pagina Universități.',
  },
};

function formatTuition(amount: number, currency?: 'EUR' | 'USD'): string {
  const symbol = currency === 'USD' ? '$' : '€';
  return `${symbol}${Math.round(amount).toLocaleString('en-US')}`;
}

/** No university matched: a localized "not found" hint (not the hard fallback). */
export function universityNotFound(locale: string): string {
  return UNI_LABELS[asLocale(locale)].notFound;
}

/**
 * Build a rich, localized answer about one university from its real data.
 * `siteUrl` is used to produce a link to the full page.
 */
export function buildUniversityAnswer(
  uni: University,
  locale: string,
  siteUrl: string
): string {
  const loc = asLocale(locale);
  const L = UNI_LABELS[loc];
  const name = universityName(uni, loc);

  const place = [uni.city, uni.country].filter(Boolean).join('، ');
  const lines: string[] = [place ? `🎓 ${name} — ${place}` : `🎓 ${name}`];

  const score = computeUniversityScore(uni);
  if (score) lines.push(`⭐ ${L.score}: ${Math.round(score.total)}/100`);
  if (uni.ranking != null) lines.push(`📊 ${L.ranking}: #${uni.ranking}`);
  if (uni.tuition != null) {
    lines.push(`💰 ${L.tuition}: ${formatTuition(uni.tuition, uni.tuitionCurrency)}`);
  }
  if (uni.international?.tuition != null) {
    lines.push(`🌍 ${L.intlTuition}: ${formatTuition(uni.international.tuition, 'USD')}`);
  }
  const intlDeadline =
    uni.international?.deadline || uni.international?.admissionPeriod;
  if (intlDeadline) lines.push(`🗓️ ${L.intlDeadline}: ${intlDeadline}`);
  if (uni.international?.languages?.length) {
    lines.push(`🗣️ ${L.languages}: ${uni.international.languages.join(', ')}`);
  }

  const desc = universityDescription(uni, loc);
  if (desc) {
    const snippet = desc.length > 220 ? `${desc.slice(0, 217).trimEnd()}…` : desc;
    lines.push('', snippet);
  }

  const base = siteUrl.replace(/\/$/, '');
  lines.push('', `🔗 ${L.more}: ${base}/${loc}/universities/${uni.slug}`);

  return lines.join('\n');
}

/**
 * When the match is ambiguous (transliterated names are lossy), list the
 * closest universities as clickable links instead of asserting one — so we
 * never give confidently-wrong facts. `unis` should already be the top hits.
 */
export function buildUniversitySuggestions(
  unis: University[],
  locale: string,
  siteUrl: string
): string {
  const loc = asLocale(locale);
  const L = UNI_LABELS[loc];
  const base = siteUrl.replace(/\/$/, '');
  const lines = [L.pickHeader, ''];
  for (const uni of unis) {
    const name = universityName(uni, loc);
    const place = [uni.city, uni.country].filter(Boolean).join('، ');
    const label = place ? `${name} (${place})` : name;
    lines.push(`• ${label}\n  ${base}/${loc}/universities/${uni.slug}`);
  }
  return lines.join('\n');
}
