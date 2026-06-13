'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { RobotMascot } from './RobotMascot';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const t = useTranslations('Chat');
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  // Pop the "need help?" bubble shortly after the robot drops in.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setShowBubble(true), 1600);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <div className="fixed bottom-24 z-50 flex flex-col items-end gap-2 ltr:right-4 rtl:left-4 sm:bottom-6">
      {open && (
        <div className="animate-bubble-in flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-theme">
          <div className="flex items-center gap-2 border-b border-border bg-accent p-3">
            <RobotMascot className="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-accent-foreground">
                {t('botName')}
              </p>
              <p className="text-xs text-accent-foreground/70">{t('available')}</p>
            </div>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              title={t('openFull')}
              className="rounded-md p-1.5 text-accent-foreground/80 hover:bg-card"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('close')}
              className="rounded-md p-1.5 text-accent-foreground/80 hover:bg-card"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ChatPanel variant="widget" />
        </div>
      )}

      {!open && showBubble && (
        <div className="animate-bubble-in relative mb-1 max-w-[14rem] rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-theme">
          {t('bubble')}
          <button
            type="button"
            onClick={() => setShowBubble(false)}
            aria-label={t('close')}
            className="absolute -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground ltr:-right-2 rtl:-left-2"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setShowBubble(false);
        }}
        aria-label={t('toggle')}
        className={`flex h-16 w-16 flex-none items-center justify-center rounded-full border border-border bg-card shadow-theme transition-transform hover:scale-105 ${
          open ? '' : 'animate-bot-drop'
        }`}
      >
        <RobotMascot className={open ? 'h-12 w-12' : 'h-12 w-12 animate-bot-bob'} waving={!open} />
      </button>
    </div>
  );
}
