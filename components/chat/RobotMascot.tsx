/**
 * SAMI — UNIREAL's little assistant robot, drawn as an inline SVG so it scales
 * crisply and adopts the brand colour (text-primary on the wrapper). Swap this
 * file for an image/Lottie/3D asset later without touching the chat widget.
 */
export function RobotMascot({
  className = '',
  waving = false,
}: {
  className?: string;
  waving?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 72"
      className={`text-primary ${className}`}
      role="img"
      aria-hidden
    >
      {/* antenna */}
      <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3.5" fill="currentColor" />

      {/* left arm (waves when `waving`) */}
      <g
        style={
          waving
            ? { transformOrigin: '14px 42px', animation: 'bot-wave 1.6s ease-in-out infinite' }
            : undefined
        }
      >
        <rect x="6" y="38" width="9" height="6" rx="3" fill="currentColor" />
      </g>
      {/* right arm */}
      <rect x="49" y="40" width="9" height="6" rx="3" fill="currentColor" />

      {/* head */}
      <rect x="12" y="13" width="40" height="32" rx="12" fill="currentColor" />
      {/* face screen */}
      <rect x="17" y="19" width="30" height="20" rx="9" fill="#22202b" />
      {/* eyes */}
      <circle cx="26" cy="29" r="3.6" fill="#7dd3fc" />
      <circle cx="38" cy="29" r="3.6" fill="#7dd3fc" />
      <circle cx="27" cy="28" r="1.2" fill="#ffffff" />
      <circle cx="39" cy="28" r="1.2" fill="#ffffff" />
      {/* smile */}
      <path d="M28 34c1.6 1.4 6.4 1.4 8 0" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* body */}
      <rect x="18" y="46" width="28" height="20" rx="8" fill="currentColor" opacity="0.92" />
      {/* chest light */}
      <circle cx="32" cy="56" r="3.2" fill="#fde68a" />
    </svg>
  );
}
