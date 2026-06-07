/**
 * Helpers for turning a free-text chat message into a university-name query.
 *
 * Most users ask the EMi assistant about a specific university, often in
 * Persian or Romanian ("در مورد دانشگاه تیمیشوآرا اطلاعات می‌خواستم"). The
 * database stores English names for every university but localized names for
 * only a fraction, so we transliterate the Persian/Arabic script to a Latin
 * approximation and let Postgres trigram word-similarity do the fuzzy matching
 * (see the `search_universities_fuzzy` SQL function). This is fully local —
 * no AI API, no cost.
 */

/** Persian/Arabic letter → rough Latin sound. Good enough for trigram match. */
const TRANSLIT: Record<string, string> = {
  ا: 'a', آ: 'a', أ: 'a', إ: 'a', ٱ: 'a',
  ب: 'b', پ: 'p', ت: 't', ث: 's',
  ج: 'j', چ: 'ch', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh',
  س: 's', ش: 'sh', ص: 's', ض: 'z',
  ط: 't', ظ: 'z', ع: 'a', غ: 'gh',
  ف: 'f', ق: 'gh', ک: 'k', ك: 'k', گ: 'g',
  ل: 'l', م: 'm', ن: 'n',
  و: 'o', ه: 'h', ة: 'h',
  ی: 'i', ي: 'i', ى: 'i', ئ: 'i', ؤ: 'o', ء: '',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/**
 * Persian/Arabic-script stop words. Their Latin forms are derived below with
 * the SAME transliterator so they line up exactly with how tokens get
 * transliterated (Persian omits short vowels, so guessing them by hand fails).
 */
const PERSIAN_STOPWORDS_SCRIPT = [
  'در', 'مورد', 'درباره', 'دانشگاه', 'دانشگاهی', 'دانشگاه‌ها', 'اطلاعات',
  'اطلاعاتی', 'می‌خواستم', 'میخواستم', 'می‌خوام', 'میخوام', 'می‌خواهم',
  'خواستم', 'برای', 'چه', 'چی', 'را', 'به', 'من', 'که', 'یا', 'یک', 'است',
  'چیست', 'کجاست', 'چطور', 'چقدر', 'لطفا', 'لطفاً', 'بگو', 'بده',
  // Greetings / pleasantries — so a bare "سلام" never fuzzy-matches a name.
  'سلام', 'درود', 'های', 'مرسی', 'ممنون',
];

/** Latin stop words (English + Romanian + greetings). */
const LATIN_STOPWORDS = [
  // English
  'the', 'of', 'a', 'an', 'and', 'in', 'at', 'for', 'about', 'info',
  'information', 'university', 'universities', 'college', 'tell', 'me',
  'want', 'wanted', 'know', 'please', 'give', 'on', 'is', 'what', 'how',
  'hi', 'hello', 'hey', 'thanks', 'thank',
  // Romanian
  'despre', 'universitatea', 'universitate', 'universitati', 'din', 'la',
  'vreau', 'informatii', 'informatii', 'spune', 'imi', 'ce', 'este',
  'salut', 'buna', 'multumesc',
];

/** Words that carry no university-name signal — dropped before matching. */
const STOPWORDS = new Set<string>(LATIN_STOPWORDS);

/** Normalize ZWNJ / Arabic diacritics out of a Persian string. */
function normalizePersian(s: string): string {
  return s
    .replace(/[ً-ْٰ]/g, '') // harakat / tanwin
    .replace(/[‌‏‎]/g, ' ') // ZWNJ + bidi marks → space
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی');
}

/** Transliterate any Persian/Arabic letters in a string to Latin. */
export function persianToLatin(input: string): string {
  const normalized = normalizePersian(input);
  let out = '';
  for (const ch of normalized) {
    out += ch in TRANSLIT ? TRANSLIT[ch] : ch;
  }
  return out;
}

// Fold the Persian-script stop words into the Latin set using the same
// transliterator, so they match transliterated tokens exactly.
for (const word of PERSIAN_STOPWORDS_SCRIPT) {
  for (const part of persianToLatin(word).toLowerCase().split(' ')) {
    if (part) STOPWORDS.add(part);
  }
}

export type UniversityQuery = {
  /** Latin form, matched against English university names. */
  latin: string;
  /** Original form, matched against localized (fa/ro) names. */
  original: string;
};

/**
 * Extract the most likely university-name query from a chat message:
 * strip punctuation + stopwords, keeping the distinctive tokens. Returns null
 * when nothing name-like remains (so we don't fuzzy-match noise).
 */
export function extractUniversityQuery(message: string): UniversityQuery | null {
  const cleaned = normalizePersian(message)
    .replace(/[\p{P}\p{S}]/gu, ' ') // drop punctuation/symbols
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;

  const tokens = cleaned.split(' ');
  const kept: string[] = [];
  const keptOriginal: string[] = [];
  for (const tok of tokens) {
    const latin = persianToLatin(tok).toLowerCase();
    if (!latin || latin.length < 2) continue;
    if (STOPWORDS.has(latin)) continue;
    kept.push(latin);
    keptOriginal.push(tok);
  }
  if (kept.length === 0) return null;

  const latin = kept.join(' ');
  // Require at least 3 letters of real signal to avoid matching stray tokens.
  if (latin.replace(/[^a-z]/g, '').length < 3) return null;

  return { latin, original: keptOriginal.join(' ') };
}
