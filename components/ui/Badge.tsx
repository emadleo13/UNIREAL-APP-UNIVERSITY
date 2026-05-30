import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'brand' | 'green' | 'slate';
};

const tones = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function Badge({ tone = 'slate', className = '', ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <Badge tone="green" title={label}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Badge>
  );
}
