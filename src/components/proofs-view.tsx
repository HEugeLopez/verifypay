"use client";

import { useApp } from "@/lib/store";
import { formatMoney, relativeTime } from "@/lib/format";
import { Badge, Card, cn } from "./ui";
import {
  CertificateCard,
  MasterProofPanel,
  ReceiptCard,
  TransactionProofCard,
  TransactionSummary,
} from "./proof-visuals";
import { Scale, ShieldCheck } from "./icons";

export function ProofsView({
  selectedTxId,
  onSelect,
}: {
  selectedTxId: string | null;
  onSelect: (txId: string) => void;
}) {
  const { transactions, getAccount, getCertificate, getTxProof, getMasterProofForTx } = useApp();

  const proofed = transactions.filter((t) => t.proofId && getMasterProofForTx(t.id));
  const activeId = selectedTxId && proofed.some((t) => t.id === selectedTxId)
    ? selectedTxId
    : proofed[0]?.id ?? null;

  const tx = proofed.find((t) => t.id === activeId);
  const cert = getCertificate(tx?.certificateId);
  const txProof = getTxProof(tx?.proofId);
  const master = tx ? getMasterProofForTx(tx.id) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Scale className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Proof explorer</h1>
            <p className="text-sm text-ink-muted">
              Inspect and independently verify each payment&apos;s identity-bound proof.
            </p>
          </div>
        </div>
      </div>

      {proofed.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-subtle">
            <ShieldCheck className="size-6" />
          </span>
          <p className="text-sm font-medium text-ink">No proofs yet</p>
          <p className="mt-1 text-sm text-ink-subtle">
            Complete a verified repayment to generate a proof bundle.
          </p>
        </Card>
      ) : (
        <>
          {/* selector */}
          {proofed.length > 1 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {proofed.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                    t.id === activeId
                      ? "border-brand bg-brand-soft text-brand-strong"
                      : "border-line bg-surface text-ink-muted hover:bg-surface-2",
                  )}
                >
                  <span className="block font-semibold text-ink">{formatMoney(t.amount, t.currency)}</span>
                  <span>{relativeTime(t.createdAt)}</span>
                </button>
              ))}
            </div>
          )}

          {tx && cert && txProof && master && (
            <div className="space-y-6 vp-fade-up">
              <Section step={1} title="Verifiable identity certificate" tone="verify">
                <CertificateCard cert={cert} />
              </Section>

              <Section step={2} title="Payment transaction">
                <TransactionSummary tx={tx} from={getAccount(tx.fromAccountId)} to={getAccount(tx.toAccountId)} />
              </Section>

              <Section step={3} title="Transaction proof (payment ↔ identity)">
                <TransactionProofCard proof={txProof} cert={cert} />
              </Section>

              <Section step={4} title="Proof of everything" tone="brand">
                <MasterProofPanel master={master} cert={cert} tx={tx} txProof={txProof} />
              </Section>

              <Section step={5} title="Payment receipt">
                <ReceiptCard
                  tx={tx}
                  cert={cert}
                  from={getAccount(tx.fromAccountId)}
                  to={getAccount(tx.toAccountId)}
                  proof={txProof}
                />
              </Section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  step,
  title,
  tone = "neutral",
  children,
}: {
  step: number;
  title: string;
  tone?: "neutral" | "brand" | "verify";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
            tone === "verify" && "bg-verify-soft text-verify-strong",
            tone === "brand" && "bg-brand-soft text-brand-strong",
            tone === "neutral" && "bg-surface-2 text-ink-muted",
          )}
        >
          {step}
        </span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
