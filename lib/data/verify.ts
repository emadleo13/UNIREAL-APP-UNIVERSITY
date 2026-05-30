import { normalizeDomain } from './slug';
import type { University } from './types';

/** The host part of an email address, e.g. "john@cs.stanford.edu" -> "cs.stanford.edu". */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  const host = email.slice(at + 1).trim().toLowerCase();
  return host || null;
}

/**
 * A user is "verified" for a university when their email domain matches (or is a
 * subdomain of) one of the university's registered domains. This powers the
 * Verified badge on reviews and answers.
 */
export function isVerifiedForUniversity(
  email: string | undefined,
  university: Pick<University, 'domains'>
): boolean {
  if (!email) return false;
  const host = emailDomain(email);
  if (!host) return false;
  return university.domains.some((d) => {
    const dom = normalizeDomain(d);
    return host === dom || host.endsWith(`.${dom}`);
  });
}
