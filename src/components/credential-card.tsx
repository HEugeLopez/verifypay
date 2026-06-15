"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import type { IssuedCredential } from "@/lib/types";
import { WalletQR } from "./wallet-qr";
import { Badge, Button, Card, CardHeader, cn } from "./ui";
import { Check, Document, Link as LinkIcon, ShieldCheck } from "./icons";

function prettyLabel(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function CredentialCard() {
  const { issuedCredential, setIssuedCredential } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(true);

  const issue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/identity/issue-credential", { method: "POST" });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Issuance failed");
      const cred: IssuedCredential = {
        offerId: data.offer.offerId,
        credentialId: data.offer.credentialId,
        credentialName: data.offer.credentialName,
        claimUri: data.offer.claimUri,
        deepLink: data.offer.deepLink,
        claims: data.claims,
        issuedAt: new Date().toISOString(),
      };
      setIssuedCredential(cred);
      setShowQR(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Issuance failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<Document />}
        title="Wallet credential"
        subtitle="Verifiable credential (TNG)"
        action={
          issuedCredential ? (
            <Badge tone="verify" icon={<Check className="size-3.5" />}>
              Ready to claim
            </Badge>
          ) : undefined
        }
      />

      {!issuedCredential ? (
        <div className="px-5 py-5">
          <p className="mb-4 text-sm text-ink-muted">
            Issue a bank-account verifiable credential to claim into your TNG wallet, so you can
            present it during a payment.
          </p>
          {error && (
            <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
          )}
          <Button variant="verify" className="w-full" loading={loading} onClick={issue}>
            {!loading && <ShieldCheck className="size-4" />}
            Issue bank account credential
          </Button>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-ink">{issuedCredential.credentialName}</p>
          <p className="mb-3 text-xs text-ink-subtle">
            Scan with your TNG wallet to claim this credential.
          </p>

          {showQR && (
            <div className="mb-3 flex flex-col items-center rounded-xl border border-line bg-surface-2 p-4">
              <WalletQR value={issuedCredential.claimUri} size={188} />
              {issuedCredential.deepLink && (
                <a
                  href={issuedCredential.deepLink}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  <LinkIcon className="size-3.5" />
                  Open in wallet app
                </a>
              )}
            </div>
          )}

          <div className="rounded-xl border border-line">
            {issuedCredential.claims.map((c, i) => (
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

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowQR((v) => !v)}>
              {showQR ? "Hide QR" : "Show QR"}
            </Button>
            <Button size="sm" variant="ghost" loading={loading} onClick={issue}>
              Re-issue
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
