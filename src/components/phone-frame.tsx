"use client";

import type { ReactNode } from "react";

// A latest-gen iPhone mockup. Renders app content inside the screen (scrollable),
// with an optional `overlay` (e.g. a modal) confined to the screen.
export function PhoneFrame({
  children,
  overlay,
  bottomBar,
}: {
  children: ReactNode;
  overlay?: ReactNode;
  bottomBar?: ReactNode;
}) {
  return (
    <div className="flex justify-center px-4 py-6 sm:py-8">
      <div className="relative" style={{ width: 384 }}>
        {/* side buttons */}
        <span className="absolute -left-[2px] top-[112px] h-9 w-[3px] rounded-l bg-zinc-600/80" />
        <span className="absolute -left-[2px] top-[166px] h-14 w-[3px] rounded-l bg-zinc-600/80" />
        <span className="absolute -left-[2px] top-[228px] h-14 w-[3px] rounded-l bg-zinc-600/80" />
        <span className="absolute -right-[2px] top-[190px] h-20 w-[3px] rounded-r bg-zinc-600/80" />

        {/* titanium body */}
        <div className="rounded-[3.4rem] bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-900 p-[3px] shadow-[0_50px_90px_-25px_rgba(13,22,38,0.5)]">
          <div className="rounded-[3.3rem] bg-black p-[9px]">
            <div
              className="relative aspect-[9/18] overflow-hidden rounded-[2.7rem]"
              style={{
                background:
                  "radial-gradient(120% 55% at 100% 0%, #e7edfb 0%, transparent 55%), radial-gradient(100% 45% at 0% 0%, #eafaf3 0%, transparent 45%), var(--color-canvas)",
              }}
            >
              {/* status bar */}
              <div className="absolute inset-x-0 top-0 z-50 flex h-[44px] items-center justify-between bg-[var(--color-canvas)]/85 px-7 text-[13px] font-semibold text-ink backdrop-blur-sm">
                <span>9:41</span>
                <span className="flex items-center gap-1.5 text-ink">
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
                    <rect x="0" y="7" width="3" height="4" rx="1" />
                    <rect x="4.5" y="5" width="3" height="6" rx="1" />
                    <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
                    <rect x="13.5" y="0" width="3" height="11" rx="1" />
                  </svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
                    <path d="M8 2.5c2.6 0 5 1 6.8 2.7l-1.4 1.4A7.5 7.5 0 0 0 8 4.5 7.5 7.5 0 0 0 2.6 6.6L1.2 5.2A9.5 9.5 0 0 1 8 2.5Z" />
                    <path d="M8 6c1.4 0 2.7.5 3.7 1.5l-1.4 1.4A2.7 2.7 0 0 0 8 8c-.8 0-1.6.3-2.3.9L4.3 7.5A5 5 0 0 1 8 6Z" />
                    <circle cx="8" cy="10.3" r="1.3" />
                  </svg>
                  <span className="flex items-center gap-[2px]">
                    <span className="relative flex h-[12px] w-[24px] items-center rounded-[3px] border border-ink/40 px-[2px]">
                      <span className="h-[7px] w-[16px] rounded-[1px] bg-ink" />
                    </span>
                    <span className="h-[4px] w-[1.5px] rounded-r-sm bg-ink/40" />
                  </span>
                </span>
              </div>

              {/* dynamic island */}
              <div className="absolute left-1/2 top-[11px] z-50 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />

              {/* app content */}
              <div
                className={`h-full overflow-y-auto overscroll-contain pt-[44px] ${bottomBar ? "pb-[88px]" : ""}`}
              >
                {children}
              </div>

              {bottomBar}
              {overlay}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
