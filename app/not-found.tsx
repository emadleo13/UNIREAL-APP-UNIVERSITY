import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n/routing';

/**
 * Global fallback for unmatched top-level routes. Redirect to the default
 * locale so the localized layout/not-found can take over.
 */
export default function GlobalNotFound() {
  redirect(`/${defaultLocale}`);
}
