'use server';

import {
  answerFromFaq,
  buildUniversityAnswer,
  buildUniversitySuggestions,
  fallbackAnswer,
  universityNotFound,
} from '@/lib/chat/assistant';
import { extractUniversityQuery } from '@/lib/chat/translit';
import { repo } from '@/lib/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://unireal.study';

/** Above this score a single, dominant hit is confident enough to answer directly. */
const CONFIDENT_MATCH = 0.6;
/** Below this score a fuzzy hit is too weak to even suggest. */
const SUGGEST_MIN = 0.45;

/**
 * Server action for the chat widget / support chat. Answers locally — no
 * external AI, no cost:
 *   1. If the message names a university, fuzzy-match it against the site's
 *      own database and answer with that university's real data.
 *   2. Otherwise try the localized keyword FAQ.
 *   3. Only when neither matches show the contact fallback.
 *
 * The DB lookup lives here (server) so the pure assistant helpers stay
 * import-safe for the client chat panel.
 */
export async function askAssistant(
  message: string,
  locale: string
): Promise<string> {
  // 1. Keyword FAQ first — feature questions ("how does the score work",
  //    "شهریه چقدر است") get a direct answer and never get mistaken for a
  //    university name.
  const faq = answerFromFaq(message, locale);
  if (faq) return faq;

  // 2. University lookup — most other questions are "tell me about <uni>".
  //    Persian/Romanian names are transliterated and fuzzy-matched, which is
  //    lossy: answer directly only on a single confident hit, otherwise offer
  //    the closest universities as links so we never assert wrong facts.
  const query = extractUniversityQuery(message);
  if (query) {
    try {
      const hits = await repo.searchUniversities(query.latin, query.original, 5);
      const matches = hits.filter((m) => m.score >= SUGGEST_MIN);
      if (matches.length === 1) {
        return buildUniversityAnswer(matches[0].university, locale, SITE_URL);
      }
      if (matches.length > 1) {
        const [top, second] = matches;
        // One clear, dominant winner → answer it directly.
        if (top.score >= CONFIDENT_MATCH && top.score - second.score >= 0.15) {
          return buildUniversityAnswer(top.university, locale, SITE_URL);
        }
        return buildUniversitySuggestions(
          matches.map((m) => m.university),
          locale,
          SITE_URL
        );
      }
    } catch {
      // Fall through to the not-found hint if the search backend is down.
    }
    // 3. Named something, but no university was close enough.
    return universityNotFound(locale);
  }

  return fallbackAnswer(locale);
}
