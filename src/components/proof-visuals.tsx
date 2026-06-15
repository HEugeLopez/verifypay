"use client";

import { useState } from "react";
import { proofApi } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type {
  Account,
  IdentityCertificate,
  MasterProof,
  Transaction,
  TransactionProof,
  VerificationReport,
} from "@/lib/types";
import { Avatar, Badge, Button, Card, CardHeader, cn, Field, HashChip } from "./ui";
import {
  ArrowRight,
  Check,
  Document,
  Fingerprint,
  HashIcon,
  Link as LinkIcon,
  Lock,
  Receipt as ReceiptIcon,
  Scale,
  ShieldCheck,
  X,
} from "./icons";

// --- Identity certificate ---------------------------------------------------

export function CertificateCard({ cert }: { cert: IdentityCertificate }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-verify-soft to-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-verify text-white">
            <ShieldCheck />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Verifiable identity certificate</h3>
            <p className="text-xs text-ink-subtle">Issued by {cert.issuer}</p>
          </div>
        </div>
        <Badge tone="verify" icon={<Check className="size-3.5" />}>
          {cert.status === "valid" ? "Verified" : cert.status}
        </Badge>
      </div>

      <div className="grid gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-2">
        <Field label="Subject" value={cert.claims.legalName} />
        <Field label="Assurance level" value={<Badge tone="brand">{cert.assuranceLevel}</Badge>} />
        <Field label="Date of birth" value={formatDate(cert.claims.dateOfBirth)} />
        <Field label="Nationality" value={cert.claims.nationality} />
        <Field label="Document" value={`${cert.claims.documentType} ${cert.claims.documentNumber}`} />
        <Field label="Verified" value={formatDateTime(cert.verifiedAt)} />
      </div>

      <div className="border-t border-line px-5 py-4">
        <p className="mb-2 text-xs font-medium text-ink-muted">Verification methods</p>
        <div className="flex flex-wrap gap-2">
          {cert.method.map((m) => (
            <Badge key={m} tone="neutral" icon={<Check className="size-3.5 text-verify" />}>
              {m}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2 px-5 py-3">
        <HashChip label="subject" value={cert.subjectHash} tone="verify" />
        <HashChip label="signature" value={cert.signature} />
        <span className="text-xs text-ink-subtle">expires {formatDate(cert.expiresAt)}</span>
      </div>
    </Card>
  );
}

// --- Transaction summary ----------------------------------------------------

export function TransactionSummary({
  tx,
  from,
  to,
}: {
  tx: Transaction;
  from?: Account;
  to?: Account;
}) {
  return (
    <Card>
      <CardHeader icon={<ReceiptIcon />} title="Payment" subtitle={tx.memo} />
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <Party account={from} caption="From" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-ink">{formatMoney(tx.amount, tx.currency)}</span>
          <ArrowRight className="my-1 text-ink-subtle" />
        </div>
        <Party account={to} caption="To" align="right" />
      </div>
      <div className="grid gap-x-6 gap-y-1 border-t border-line px-5 py-4 sm:grid-cols-2">
        {tx.loanRef && <Field label="Loan reference" value={tx.loanRef} />}
        <Field label="Date" value={formatDateTime(tx.createdAt)} />
        <Field
          label="Status"
          value={
            <Badge tone="success" icon={<Check className="size-3.5" />}>
              Settled
            </Badge>
          }
        />
        <Field label="Transaction ID" value={<span className="font-mono text-xs">{tx.id}</span>} />
      </div>
      {tx.txHash && (
        <div className="border-t border-line bg-surface-2 px-5 py-3">
          <HashChip label="tx hash" value={tx.txHash} />
        </div>
      )}
    </Card>
  );
}

function Party({
  account,
  caption,
  align = "left",
}: {
  account?: Account;
  caption: string;
  align?: "left" | "right";
}) {
  if (!account) return null;
  return (
    <div className={cn("flex items-center gap-3", align === "right" && "flex-row-reverse text-right")}>
      <Avatar name={account.displayName} accent={account.accent} size={42} />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-ink-subtle">{caption}</p>
        <p className="text-sm font-semibold text-ink">{account.displayName}</p>
        <p className="text-xs text-ink-subtle">{account.handle}</p>
      </div>
    </div>
  );
}

// --- Transaction proof ------------------------------------------------------

export function TransactionProofCard({ proof }: { proof: TransactionProof }) {
  return (
    <Card>
      <CardHeader
        icon={<LinkIcon />}
        title="Transaction proof"
        subtitle={`Attested by ${proof.attestor}`}
      />
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-surface-2 px-4 py-4">
          <HashChip label="payment" value={proof.txHash} />
          <span className="text-ink-subtle">+</span>
          <HashChip label="identity" value={proof.certHash} tone="verify" />
          <ArrowRight className="text-ink-subtle" />
          <HashChip label="proof" value={proof.proofHash} />
        </div>
        <p className="mt-3 text-center text-xs text-ink-subtle">
          The proof hash cryptographically binds this exact payment to this exact identity
          certificate.
        </p>
      </div>
      <div className="border-t border-line bg-surface-2 px-5 py-3">
        <HashChip label="signature" value={proof.signature} />
      </div>
    </Card>
  );
}

// --- Master proof + verification --------------------------------------------

const leafIcon = {
  certificate: <Fingerprint className="size-4" />,
  transaction: <ReceiptIcon className="size-4" />,
  transactionProof: <LinkIcon className="size-4" />,
} as const;

export function MasterProofPanel({
  master,
  cert,
  tx,
  txProof,
}: {
  master: MasterProof;
  cert: IdentityCertificate;
  tx: Transaction;
  txProof: TransactionProof;
}) {
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tamper, setTamper] = useState(false);

  const runVerify = async () => {
    setVerifying(true);
    setReport(null);
    // When "tamper" is on, mutate a field to show verification catch it.
    const txArg = tamper ? { ...tx, amount: tx.amount + 1000 } : tx;
    const result = await proofApi.verifyMasterProof(master, cert, txArg, txProof);
    setReport(result);
    setVerifying(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-soft to-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
            <Scale />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Proof of everything</h3>
            <p className="text-xs text-ink-subtle">
              One Merkle root over identity, payment &amp; proof
            </p>
          </div>
        </div>
        <Lock className="text-brand" />
      </div>

      {/* Merkle tree */}
      <div className="px-5 py-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {master.leaves.map((leaf) => (
            <div key={leaf.refId} className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="mb-2 flex items-center gap-2 text-ink-muted">
                {leafIcon[leaf.kind]}
                <span className="text-xs font-medium">{leaf.label}</span>
              </div>
              <HashChip value={leaf.hash} edge={6} />
            </div>
          ))}
        </div>
        <div className="my-3 flex justify-center text-ink-subtle">
          <div className="flex flex-col items-center">
            <div className="h-4 w-px bg-line-strong" />
            <span className="text-[11px]">hashed pairwise → root</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-brand-soft bg-brand-soft/60 p-4">
          <span className="text-[11px] uppercase tracking-wide text-brand-strong">Merkle root</span>
          <HashChip value={master.merkleRoot} edge={10} />
          <HashChip label="notary sig" value={master.signature} edge={8} />
        </div>
      </div>

      {/* Verify controls */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={tamper}
              onChange={(e) => setTamper(e.target.checked)}
              className="size-4 accent-[var(--color-danger)]"
            />
            Simulate tampering (alter the payment amount)
          </label>
          <Button variant="verify" onClick={runVerify} loading={verifying}>
            {!verifying && <ShieldCheck className="size-4" />}
            {verifying ? "Verifying…" : "Run full verification"}
          </Button>
        </div>

        {report && (
          <div className="mt-4 vp-fade-up">
            <div
              className={cn(
                "mb-3 flex items-center gap-3 rounded-xl px-4 py-3",
                report.ok ? "bg-verify-soft text-verify-strong" : "bg-danger-soft text-danger",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-white",
                  report.ok ? "bg-verify" : "bg-danger",
                )}
              >
                {report.ok ? <Check /> : <X />}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {report.ok ? "Proof verified" : "Verification failed"}
                </p>
                <p className="text-xs opacity-80">
                  {report.ok
                    ? "Every hash and signature was independently recomputed and matched."
                    : "One or more checks did not match — the data has been altered."}
                </p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {report.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 rounded-lg px-2 py-1.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                      c.ok ? "bg-verify" : "bg-danger",
                    )}
                  >
                    {c.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{c.label}</p>
                    <p className="text-xs text-ink-subtle">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

// --- Receipt (identity attached) --------------------------------------------

export function ReceiptCard({
  tx,
  cert,
  from,
  to,
  proof,
}: {
  tx: Transaction;
  cert: IdentityCertificate;
  from?: Account;
  to?: Account;
  proof?: TransactionProof;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-4">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-white">
            <ShieldCheck className="size-4" />
          </span>
          VerifyPay receipt
        </div>
        <Badge tone="verify" icon={<Check className="size-3.5" />}>
          Identity-verified payment
        </Badge>
      </div>

      <div className="px-5 py-5 text-center">
        <p className="text-xs uppercase tracking-wide text-ink-subtle">Amount paid</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          {formatMoney(tx.amount, tx.currency)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{tx.memo}</p>
      </div>

      <div className="grid gap-x-6 border-t border-line px-5 py-4 sm:grid-cols-2">
        <Field label="From" value={from?.displayName} />
        <Field label="To" value={to?.displayName} />
        {tx.loanRef && <Field label="Loan reference" value={tx.loanRef} />}
        <Field label="Date" value={formatDateTime(tx.createdAt)} />
        <Field label="Receipt ID" value={<span className="font-mono text-xs">{tx.id}</span>} />
        <Field
          label="Status"
          value={<Badge tone="success">Settled</Badge>}
        />
      </div>

      {/* Attached identity */}
      <div className="border-t border-line px-5 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Fingerprint className="size-4 text-verify" />
          Attached identity verification
        </div>
        <div className="rounded-xl border border-verify-soft bg-verify-soft/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{cert.claims.legalName}</p>
              <p className="text-xs text-ink-muted">
                {cert.issuer} · {cert.assuranceLevel} · verified {formatDate(cert.verifiedAt)}
              </p>
            </div>
            <Badge tone="verify" icon={<Check className="size-3.5" />}>
              Verified
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <HashChip label="identity" value={cert.subjectHash} tone="verify" />
            {proof && <HashChip label="proof" value={proof.proofHash} />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-5 py-3 text-xs text-ink-subtle">
        <Document className="size-4" />
        This receipt is backed by a cryptographic proof binding the payment to a verified identity.
      </div>
    </Card>
  );
}

// small shared seal used in headers
export function Seal() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-white">
      <ShieldCheck className="size-4" />
    </span>
  );
}

export { HashIcon };
