'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { askAssistant } from '@/app/chat-actions';
import { greeting, type ChatMessage } from '@/lib/chat/assistant';

export function ChatPanel({ variant = 'widget' }: { variant?: 'widget' | 'page' }) {
  const t = useTranslations('Chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting(locale) },
  ]);
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Scroll the message list itself (never the page) — and skip the first
    // render so opening the Contact page doesn't jump the window to the chat.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    startTransition(async () => {
      const reply = await askAssistant(trimmed, locale);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    });
  }

  const suggestions = [t('q1'), t('q2'), t('q3')];
  const messagesHeight = variant === 'page' ? 'h-[55vh]' : 'h-72';

  return (
    <div className="flex flex-col">
      <div
        ref={listRef}
        className={`${messagesHeight} space-y-3 overflow-y-auto p-3`}
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              …
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="flex-none rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {t('send')}
        </button>
      </form>

      <p className="px-3 pb-2 text-center text-[11px] text-muted-foreground">
        {t('disclaimer')}
      </p>
    </div>
  );
}
