'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { VerifiedBadge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { addAnswer, addQuestion } from '@/app/actions';
import type { Question } from '@/lib/data/types';

export function QuestionSection({
  universityId,
  initialQuestions,
}: {
  universityId: string;
  initialQuestions: Question[];
}) {
  const t = useTranslations('Questions');
  const { user } = useAuth();
  const [questions, setQuestions] = useState(initialQuestions);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();

  function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const authorName = user?.name || name || 'Anonymous';
    startTransition(async () => {
      const next = await addQuestion({
        universityId,
        authorName,
        body: body.trim(),
        authorEmail: user?.email,
      });
      setQuestions(next);
      setBody('');
      setName('');
    });
  }

  return (
    <section id="questions" className="scroll-mt-20">
      <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>

      <Card className="mt-4 p-4">
        <form onSubmit={submitQuestion} className="space-y-3">
          {!user && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('questionPlaceholder')}
            rows={2}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('demoNotice')}</p>
            <Button type="submit" disabled={pending}>
              {t('submit')}
            </Button>
          </div>
        </form>
      </Card>

      <ul className="mt-4 space-y-3">
        {questions.length === 0 && (
          <li className="text-sm text-muted-foreground">{t('empty')}</li>
        )}
        {questions.map((q) => (
          <li key={q.id}>
            <QuestionItem
              question={q}
              universityId={universityId}
              onUpdated={setQuestions}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuestionItem({
  question,
  universityId,
  onUpdated,
}: {
  question: Question;
  universityId: string;
  onUpdated: (qs: Question[]) => void;
}) {
  const t = useTranslations('Questions');
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    const authorName = user?.name || name || 'Anonymous';
    startTransition(async () => {
      const next = await addAnswer(
        {
          questionId: question.id,
          authorName,
          body: answer.trim(),
          authorEmail: user?.email,
        },
        universityId
      );
      onUpdated(next);
      setAnswer('');
      setName('');
      setOpen(false);
    });
  }

  return (
    <Card className="p-4">
      <p className="font-medium text-foreground">{question.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {question.authorName} · {t('answersCount', { count: question.answers.length })}
      </p>

      <ul className="mt-3 space-y-2 border-s-2 border-border ps-3">
        {question.answers.map((a) => (
          <li key={a.id} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{a.authorName}</span>
              {a.verified && <VerifiedBadge label="✓" />}
            </div>
            <p className="text-muted-foreground">{a.body}</p>
          </li>
        ))}
      </ul>

      {open ? (
        <form onSubmit={submitAnswer} className="mt-3 space-y-2">
          {!user && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          )}
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('answerPlaceholder')}
            rows={2}
          />
          <Button type="submit" size="sm" disabled={pending}>
            {t('submitAnswer')}
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-sm font-medium text-primary hover:opacity-80"
        >
          {t('answer')}
        </button>
      )}
    </Card>
  );
}
