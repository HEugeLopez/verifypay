// Illustrated flat-style avatar for Amara Okafor.
export function AmaraAvatar({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Amara Okafor"
    >
      <defs>
        <linearGradient id="amara-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9d6" />
          <stop offset="1" stopColor="#ffd9e2" />
        </linearGradient>
        <clipPath id="amara-clip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath="url(#amara-clip)">
        <rect width="100" height="100" fill="url(#amara-bg)" />
        {/* shoulders / top */}
        <path d="M14 100 C14 79 31 69 50 69 C69 69 86 79 86 100 Z" fill="#0f9d6b" />
        <path d="M50 69 C44 69 39 70 34 72 L50 86 L66 72 C61 70 56 69 50 69 Z" fill="#0c8a5d" />
        {/* neck */}
        <rect x="43" y="58" width="14" height="16" rx="6" fill="#9b643d" />
        {/* hair (back) */}
        <circle cx="50" cy="42" r="29" fill="#241a12" />
        {/* face */}
        <ellipse cx="50" cy="48" rx="21" ry="23" fill="#a86c41" />
        {/* ears + earrings */}
        <circle cx="29" cy="50" r="4.5" fill="#a86c41" />
        <circle cx="71" cy="50" r="4.5" fill="#a86c41" />
        <circle cx="29" cy="56" r="1.7" fill="#f2c14e" />
        <circle cx="71" cy="56" r="1.7" fill="#f2c14e" />
        {/* hair (front fringe) */}
        <path
          d="M28 41 C29 25 41 19 50 19 C59 19 71 25 72 41 C66 33 58 30 50 30 C42 30 34 33 28 41 Z"
          fill="#241a12"
        />
        {/* eyebrows */}
        <path d="M38 44 Q42 41.5 46 44" stroke="#3a2a1c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M54 44 Q58 41.5 62 44" stroke="#3a2a1c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <ellipse cx="42" cy="49" rx="2.4" ry="3" fill="#2a1d12" />
        <ellipse cx="58" cy="49" rx="2.4" ry="3" fill="#2a1d12" />
        {/* nose */}
        <path d="M50 51 L50 55" stroke="#8a5530" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx="37" cy="55" r="3" fill="#d98a6a" opacity="0.35" />
        <circle cx="63" cy="55" r="3" fill="#d98a6a" opacity="0.35" />
        {/* smile */}
        <path d="M44 59 Q50 64 56 59" stroke="#6e3f22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
