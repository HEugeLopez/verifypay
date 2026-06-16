"use client";

import { Clock, Plus, User, Wallet as WalletIcon } from "./icons";
import { cn } from "./ui";

// Wallet-style fixed bottom navigation for the phone.
export function PhoneNav({
  active,
  onHome,
  onActivity,
  onProfile,
  onNew,
}: {
  active: "dashboard" | "activity" | "proofs";
  onHome: () => void;
  onActivity: () => void;
  onProfile: () => void;
  onNew: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
      <div className="flex items-center justify-around rounded-[22px] border border-line bg-surface/90 px-2 py-2 shadow-[0_-10px_30px_-18px_rgba(13,22,38,0.4)] backdrop-blur">
        <NavBtn icon={<WalletIcon className="size-5" />} label="Home" active={active === "dashboard"} onClick={onHome} />
        <NavBtn icon={<Clock className="size-5" />} label="Activity" active={active === "activity"} onClick={onActivity} />
        <button
          onClick={onNew}
          aria-label="New transaction"
          className="-mt-7 flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_26px_-8px_rgba(37,99,235,0.85)] transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
        <NavBtn icon={<User className="size-5" />} label="Profile" active={false} onClick={onProfile} />
      </div>
    </div>
  );
}

function NavBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-16 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
        active ? "text-brand" : "text-ink-subtle hover:text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
