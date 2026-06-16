"use client";

import { useApp } from "@/lib/store";
import { Avatar, cn } from "./ui";
import { Scale, ShieldCheck, Exchange, Wallet as WalletIcon } from "./icons";

export type View = "dashboard" | "activity" | "proofs";

export function TopBar({
  view,
  onView,
  showNav = true,
}: {
  view: View;
  onView: (v: View) => void;
  showNav?: boolean;
}) {
  const { accounts, activeAccount, setActiveAccount, reset } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        {/* brand */}
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.8)]">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink">VerifyPay</p>
            <p className="text-[11px] text-ink-subtle">Identity-verified payments</p>
          </div>
        </div>

        {/* nav (lender web view; the borrower phone uses its own bottom nav) */}
        {showNav && (
          <nav className="ml-2 flex items-center gap-1 rounded-xl bg-surface-2 p-1">
            <NavButton active={view === "dashboard"} onClick={() => onView("dashboard")} icon={<WalletIcon className="size-4" />}>
              Dashboard
            </NavButton>
            <NavButton active={view === "proofs"} onClick={() => onView("proofs")} icon={<Scale className="size-4" />}>
              Proofs
            </NavButton>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={reset}
            title="Reset demo data"
            className="hidden rounded-lg px-2.5 py-1.5 text-xs text-ink-subtle hover:bg-surface-2 hover:text-ink sm:block"
          >
            Reset demo
          </button>

          {/* account switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {accounts.map((a) => {
              const active = a.id === activeAccount.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveAccount(a.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors",
                    active ? "bg-surface-2" : "opacity-60 hover:opacity-100",
                  )}
                  title={`View as ${a.displayName}`}
                >
                  <Avatar name={a.displayName} accent={a.accent} size={26} />
                  <span className="hidden text-xs font-medium text-ink md:block">
                    {a.role === "borrower" ? "Borrower" : "Lender"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-muted hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export { Exchange };
