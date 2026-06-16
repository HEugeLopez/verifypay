"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { DEMO_CREDENTIALS, type DemoCredential } from "@/lib/demo-credentials";
import { AmaraAvatar } from "./amara-avatar";
import { WalletQR } from "./wallet-qr";
import { Badge, Card, CardHeader, cn } from "./ui";
import {
  Building,
  Check,
  IdCard,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  Sparkle,
  User,
  X,
} from "./icons";

function prettyLabel(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

const ICONS = { bank: Building, email: Mail, license: IdCard } as const;

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { borrower } = useApp();
  const p = borrower.profile;

  return (
    <div className="absolute inset-x-0 bottom-0 top-[44px] z-40 overflow-y-auto bg-[var(--color-canvas)] vp-fade-up">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold text-ink">Profile</span>
        <button
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
        >
          <X />
        </button>
      </div>

      <div className="space-y-4 px-4 py-5">
        {/* identity header */}
        <div className="flex flex-col items-center text-center">
          <AmaraAvatar size={88} className="shadow-[var(--shadow-card)]" />
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-ink">{p.legalName}</h2>
          <p className="text-sm text-ink-muted">
            {borrower.handle} · {p.email}
          </p>
          <Badge tone="verify" className="mt-2" icon={<Check className="size-3.5" />}>
            Identity-verified
          </Badge>
        </div>

        {/* personal details */}
        <Card>
          <CardHeader icon={<User />} title="Personal details" />
          <div className="px-5 py-3 text-sm">
            <Row label="Date of birth" value={formatDate(p.dateOfBirth)} />
            <Row label="Nationality" value={p.nationality} />
            <Row label="Document" value={`${p.documentType} ${p.documentNumber}`} />
            <Row label="Location" value={p.addressCity} />
          </div>
        </Card>

        {/* wallet credentials (all claimed) */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-ink">Wallet credentials</h3>
            <span className="text-xs text-ink-subtle">{DEMO_CREDENTIALS.length} held</span>
          </div>
          <div className="space-y-3">
            {DEMO_CREDENTIALS.map((def) => (
              <CredentialItem key={def.credentialId} def={def} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A single credential shown as already claimed, with a Demo CTA that reveals
// (issues) the actual verifiable credential claim QR.
function CredentialItem({ def }: { def: DemoCredential }) {
  const Icon = ICONS[def.icon];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimUri, setClaimUri] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | undefined>(undefined);

  const toggle = async () => {
    if (claimUri) {
      setOpen((o) => !o);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/identity/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: def.credentialId }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Issuance failed");
      setClaimUri(data.offer.claimUri);
      setDeepLink(data.offer.deepLink);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Issuance failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
      {/* gradient credential card */}
      <div className="relative px-4 pb-4 pt-4 text-white" style={{ background: def.gradient }}>
        {/* soft highlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.25) 0%, transparent 45%)",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-base font-semibold tracking-tight">{def.name}</h4>
              <p className="text-sm text-white/80">{def.description}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-medium backdrop-blur">
              <Check className="size-3" />
              In wallet
            </span>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Icon className="size-5" />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wide text-white/70">Issuer</p>
                <p className="text-sm font-medium">{def.issuer}</p>
              </div>
            </div>
            <span className="flex flex-col items-center gap-[3px] pb-1 text-white/60">
              <span className="size-[3px] rounded-full bg-current" />
              <span className="size-[3px] rounded-full bg-current" />
              <span className="size-[3px] rounded-full bg-current" />
            </span>
          </div>
        </div>
      </div>

      {/* Demo CTA hides the actual VC claim QR */}
      <button
        onClick={toggle}
        className="flex w-full items-center justify-center gap-2 bg-surface px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2"
      >
        {loading ? (
          <span className="size-4 rounded-full border-2 border-current border-t-transparent vp-spin" />
        ) : (
          <Sparkle className="size-4 text-brand" />
        )}
        {open && claimUri ? "Hide claim QR" : "Demo · show claim QR"}
      </button>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-4 vp-fade-up">
          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
          )}
          {claimUri && !loading && (
            <>
              <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 p-4">
                <WalletQR value={claimUri} size={184} />
                {deepLink && (
                  <a
                    href={deepLink}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                  >
                    <LinkIcon className="size-3.5" />
                    Open in wallet app
                  </a>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-center text-xs text-ink-subtle">
                  <ShieldCheck className="size-3.5 text-verify" />
                  Demo: scan to claim this credential into a wallet
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-line">
                {def.claims.slice(0, 5).map((c, i) => (
                  <div
                    key={c.claimName}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-1.5 text-sm",
                      i > 0 && "border-t border-line",
                    )}
                  >
                    <span className="text-ink-muted">{prettyLabel(c.claimName)}</span>
                    <span className="truncate text-right font-medium text-ink">{c.claimValue}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
