"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/format";
import type { IssuedCredential } from "@/lib/types";
import { AmaraAvatar } from "./amara-avatar";
import { WalletQR } from "./wallet-qr";
import { Badge, Card, CardHeader, cn } from "./ui";
import { Check, Document, Link as LinkIcon, ShieldCheck, Spinner, User, X } from "./icons";

function prettyLabel(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { borrower, setIssuedCredential } = useApp();
  const p = borrower.profile;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cred, setCred] = useState<IssuedCredential | null>(null);

  // Issue a fresh credential every time the profile opens.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/identity/issue-credential", { method: "POST" });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error ?? "Issuance failed");
        if (!active) return;
        const c: IssuedCredential = {
          offerId: data.offer.offerId,
          credentialId: data.offer.credentialId,
          credentialName: data.offer.credentialName,
          claimUri: data.offer.claimUri,
          deepLink: data.offer.deepLink,
          claims: data.claims,
          issuedAt: new Date().toISOString(),
        };
        setCred(c);
        setIssuedCredential(c);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Issuance failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setIssuedCredential]);

  return (
    <div className="absolute inset-x-0 bottom-0 top-[44px] z-40 overflow-y-auto bg-[var(--color-canvas)] vp-fade-up">
      {/* sheet header */}
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
          <AmaraAvatar size={88} className="rounded-full shadow-[var(--shadow-card)]" />
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-ink">{p.legalName}</h2>
          <p className="text-sm text-ink-muted">
            {borrower.handle} · {p.email}
          </p>
          <Badge tone="verify" className="mt-2" icon={<Check className="size-3.5" />}>
            Identity-verified
          </Badge>
        </div>

        {/* profile details */}
        <Card>
          <CardHeader icon={<User />} title="Personal details" />
          <div className="px-5 py-3 text-sm">
            <Row label="Date of birth" value={formatDate(p.dateOfBirth)} />
            <Row label="Nationality" value={p.nationality} />
            <Row label="Document" value={`${p.documentType} ${p.documentNumber}`} />
            <Row label="Location" value={p.addressCity} />
          </div>
        </Card>

        {/* fresh credential claim */}
        <Card>
          <CardHeader
            icon={<Document />}
            title="Claim a wallet credential"
            subtitle="A new verifiable credential is issued each visit"
            action={
              cred ? (
                <Badge tone="verify" icon={<Check className="size-3.5" />}>
                  Ready
                </Badge>
              ) : undefined
            }
          />
          <div className="px-5 py-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Spinner className="size-7 text-verify vp-spin" />
                <p className="text-sm text-ink-muted">Issuing a fresh credential…</p>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
            )}

            {cred && !loading && (
              <>
                <p className="mb-3 text-sm font-semibold text-ink">{cred.credentialName}</p>
                <div className="mb-3 flex flex-col items-center rounded-xl border border-line bg-surface-2 p-4">
                  <WalletQR value={cred.claimUri} size={196} />
                  {cred.deepLink && (
                    <a
                      href={cred.deepLink}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                    >
                      <LinkIcon className="size-3.5" />
                      Open in wallet app
                    </a>
                  )}
                </div>
                <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-subtle">
                  <ShieldCheck className="size-3.5 text-verify" />
                  Scan with your TNG Identity wallet to claim
                </p>
                <div className="rounded-xl border border-line">
                  {cred.claims.map((c, i) => (
                    <div
                      key={c.claimName}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 text-sm",
                        i > 0 && "border-t border-line",
                      )}
                    >
                      <span className="text-ink-muted">{prettyLabel(c.claimName)}</span>
                      <span className="text-right font-medium text-ink">{c.claimValue}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
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
