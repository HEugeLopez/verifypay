import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 20,
  height: 20,
  ...props,
});

export const ShieldCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.2 2.8 7.5 7 9 4.2-1.5 7-4.8 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Wallet = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2Z" />
    <path d="M16 13h.01" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const Fingerprint = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 10a2 2 0 0 0-2 2c0 1.5.2 3 .5 4" />
    <path d="M12 6a6 6 0 0 0-6 6c0 1 .1 2 .3 3" />
    <path d="M12 14c0 2 .3 3.6.8 5" />
    <path d="M16 12a4 4 0 0 0-4-4" />
    <path d="M18 12c0 3 .4 5 1 7" />
    <path d="M7.5 18.5c-.4-1-.5-2-.5-3" />
  </svg>
);

export const Lock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const Document = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M5 5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

export const HashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 4 7 20M17 4l-2 16M5 9h15M4 15h15" />
  </svg>
);

export const Spinner = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

export const User = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </svg>
);

export const Building = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
    <path d="M15 9h2a2 2 0 0 1 2 2v10" />
    <path d="M3 21h18M9 7h2M9 11h2M9 15h2" />
  </svg>
);

export const Copy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Plus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Exchange = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4 3 8l4 4" />
    <path d="M3 8h14" />
    <path d="m17 20 4-4-4-4" />
    <path d="M21 16H7" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const X = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
);

export const Sparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

export const Link = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 15 15 9" />
    <path d="M11 6.5 13 4.5a4 4 0 0 1 6 6l-2 2" />
    <path d="M13 17.5 11 19.5a4 4 0 0 1-6-6l2-2" />
  </svg>
);

export const Receipt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const Scale = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v18M7 21h10" />
    <path d="m6 7 12-2" />
    <path d="M6 7 3 13a3 3 0 0 0 6 0L6 7Z" />
    <path d="m18 5-3 6a3 3 0 0 0 6 0l-3-6Z" />
  </svg>
);
