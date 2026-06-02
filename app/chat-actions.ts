'use server';

import { answerQuestion } from '@/lib/chat/assistant';

/**
 * Server action for the chat widget / support chat. Kept server-side so that
 * when the Claude-powered brain lands, the API key never reaches the client.
 * For now it delegates to the placeholder FAQ matcher.
 */
export async function askAssistant(
  message: string,
  locale: string
): Promise<string> {
  // TODO(ai): call Claude here (claude-sonnet-4-6) with site data as context.
  return answerQuestion(message, locale);
}
