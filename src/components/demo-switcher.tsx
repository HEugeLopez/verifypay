"use client";

import Link from "next/link";
import { cn } from "./ui";

// Floating label + toggle to switch the front end between the two demos.
// "Loan Payment" → "/"  ·  "Credit History" → "/onboard".
// The `?d=loan` marker lets the loan demo load even on a deployment whose
// DEMO_HOME redirect would otherwise send "/" to the onboarding demo.
export function DemoSwitcher({ current }: { current: "loan" | "onboard" }) {
  return (
    <div className="fixed left-1/2 top-3 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-line bg-surface/90 px-1.5 py-1 shadow-[var(--shadow-pop)] backdrop-blur">
        <span className="select-none pl-1.5 pr-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Demo
        </span>
        <Opt href="/?d=loan" active={current === "loan"} label="Loan Payment" />
        <Opt href="/onboard" active={current === "onboard"} label="Credit History" />
      </div>
    </div>
  );
}

function Opt({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-ink text-white shadow-sm" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
