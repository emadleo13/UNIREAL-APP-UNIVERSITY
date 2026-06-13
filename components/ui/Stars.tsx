'use client';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

/** Read-only when no onChange is supplied; interactive otherwise. */
export function Stars({ value, onChange, size = 18 }: Props) {
  const interactive = typeof onChange === 'function';
  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const Star = (
          <svg
            viewBox="0 0 20 20"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            className={filled ? 'text-amber-500' : 'text-border'}
            style={{ width: size, height: size }}
            aria-hidden
          >
            <path
              strokeWidth={1.5}
              d="M9.05 2.927c.3-.921 1.6-.921 1.9 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.347 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z"
            />
          </svg>
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange!(star)}
            aria-label={`${star}`}
            className="rounded p-2"
          >
            {Star}
          </button>
        ) : (
          <span key={star}>{Star}</span>
        );
      })}
    </div>
  );
}
