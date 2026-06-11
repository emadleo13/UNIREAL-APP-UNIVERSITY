/**
 * Freemium funnel limits (guest → free verified account → Pro).
 * University pages, search, reviews and official-site links stay open to
 * everyone (SEO priority) — only saving favorites (and the deadline-reminder
 * emails that come with them) is limited.
 */

/** Universities a signed-out visitor can save (kept in localStorage). */
export const GUEST_FAVORITES_LIMIT = 2;

/** Universities a signed-in (email-verified) free user can save. */
export const FREE_FAVORITES_LIMIT = 5;
