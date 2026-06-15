"use client";

import { useState } from "react";
import { identityApi, paymentsApi, proofApi } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/lib/store";
import type {
  IdentityCertificate,
  MasterProof,
  Transaction,
  TransactionProof,
} from "@/lib/types";
import { Avatar, Badge, Button, Card, cn } from "./ui";
import {
  CertificateCard,
  MasterProofPanel,
  ReceiptCard,
} from "./proof-visuals";
import {
  ArrowRight,
  Check,
  Fingerprint,
  Lock,
  Receipt as ReceiptIcon,
  Scale,
  ShieldCheck,
  Spinner,
  X,
} from "./icons";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Step = "identity" | "review" | "sealing" | "done";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "identity", label: "Identity", icon: <Fingerprint className="size-4" /> },
  { key: "review", label: "Pay", icon: <ReceiptIcon className="size-4" /> },
  { key: "sealing", label: "Proof", icon: <Lock className="size-4" /> },
  { key: "done", label: "Receipt", icon: <ShieldCheck className="size-4" /> },
];

const IDENTITY_STAGES = [
  "Scanning government ID",
  "Matching liveness selfie",
  "Screening sanctions & PEP lists",
  "Issuing signed certificate",
];

const SEAL_STAGES = [
  "Submitting payment",
  "Settling funds between wallets",
  "Creating transaction proof",
  "Sealing proof of everything",
];

export function RepaymentWizard({
  onClose,
  onViewProof,
}: {
  onClose: () => void;
  onViewProof: (txId: string) => void;
}) {
  const { borrower, lender, loan, addCertificate, applyTransaction, addTxProof, addMasterProof } =
    useApp();

  const [step, setStep] = useState<Step>("identity");
  const [idPhase, setIdPhase] = useState<"intro" | "running" | "issued">("intro");
  const [stage, setStage] = useState(0);

  const [cert, setCert] = useState<IdentityCertificate | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [txProof, setTxProof] = useState<TransactionProof | null>(null);
  const [master, setMaster] = useState<MasterProof | null>(null);

  const installmentNo = loan.installmentsPaid + 1;
  const amount = loan.installment;
  const memo = `Loan repayment · installment ${installmentNo} of ${loan.installmentsTotal}`;

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  // --- step actions ---------------------------------------------------------

  const runIdentity = async () => {
    setIdPhase("running");
    setStage(0);
    const apiP = identityApi.verify(borrower);
    for (let i = 0; i < IDENTITY_STAGES.length; i++) {
      await wait(430);
      setStage(i + 1);
    }
    const c = await apiP;
    addCertificate(c);
    setCert(c);
    setIdPhase("issued");
  };

  const runSeal = async () => {
    if (!cert) return;
    setStep("sealing");
    setStage(0);
    const newTx = await paymentsApi.execute({
      kind: "repayment",
      fromAccountId: borrower.id,
      toAccountId: lender.id,
      amount,
      currency: borrower.currency,
      memo,
      loanRef: loan.reference,
      certificateId: cert.id,
    });
    applyTransaction(newTx);
    setTx(newTx);
    setStage(1);
    await wait(300);
    setStage(2);
    const p = await proofApi.createTransactionProof(newTx, cert);
    addTxProof(p);
    setTxProof(p);
    setStage(3);
    const m = await proofApi.createMasterProof(newTx, cert, p);
    addMasterProof(m);
    setMaster(m);
    await wait(450);
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-2xl vp-pop">
        {/* header */}
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck className="size-5 text-brand" />
            New loan repayment
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
          >
            <X />
          </button>
        </div>

        {/* stepper */}
        <div className="mb-3 flex items-center gap-1 rounded-2xl border border-line bg-surface px-3 py-3 shadow-[var(--shadow-card)]">
          {STEPS.map((s, i) => {
            const done = i < currentStepIndex || step === "done";
            const active = i === currentStepIndex && step !== "done";
            return (
              <div key={s.key} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors",
                    active && "bg-brand-soft text-brand-strong",
                    done && !active && "text-verify-strong",
                    !active && !done && "text-ink-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full",
                      active && "bg-brand text-white",
                      done && !active && "bg-verify text-white",
                      !active && !done && "bg-surface-2",
                    )}
                  >
                    {done && !active ? <Check className="size-3.5" /> : s.icon}
                  </span>
                  <span className="hidden text-xs font-medium sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-2 bg-line" />}
              </div>
            );
          })}
        </div>

        {/* body */}
        <div className="space-y-4">
          {step === "identity" && (
            <IdentityStep
              phase={idPhase}
              stage={stage}
              cert={cert}
              borrower={borrower}
              onStart={runIdentity}
              onContinue={() => setStep("review")}
            />
          )}

          {step === "review" && cert && (
            <ReviewStep
              amount={amount}
              memo={memo}
              installmentNo={installmentNo}
              total={loan.installmentsTotal}
              loanRef={loan.reference}
              borrower={borrower}
              lender={lender}
              cert={cert}
              onBack={() => setStep("identity")}
              onConfirm={runSeal}
            />
          )}

          {step === "sealing" && (
            <Card className="px-5 py-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Scale />
                </span>
                <h3 className="text-base font-semibold text-ink">Settling &amp; sealing proof</h3>
                <p className="text-sm text-ink-muted">
                  Moving funds and generating cryptographic proofs.
                </p>
              </div>
              <StageList stages={SEAL_STAGES} current={stage} />
            </Card>
          )}

          {step === "done" && tx && cert && master && txProof && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2 text-center vp-fade-up">
                <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-verify text-white vp-pulse-ring">
                  <Check className="size-7" />
                </span>
                <h3 className="text-lg font-semibold text-ink">Repayment complete</h3>
                <p className="text-sm text-ink-muted">
                  Identity-verified and bound to a verifiable proof.
                </p>
              </div>
              <ReceiptCard tx={tx} cert={cert} from={borrower} to={lender} proof={txProof} />
              <MasterProofPanel master={master} cert={cert} tx={tx} txProof={txProof} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => onViewProof(tx.id)}>
                  Open in proof explorer
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Identity step ----------------------------------------------------------

function IdentityStep({
  phase,
  stage,
  cert,
  borrower,
  onStart,
  onContinue,
}: {
  phase: "intro" | "running" | "issued";
  stage: number;
  cert: IdentityCertificate | null;
  borrower: { displayName: string; accent: string; profile: { legalName: string; documentType: string; documentNumber: string; addressCity: string } };
  onStart: () => void;
  onContinue: () => void;
}) {
  return (
    <Card className="px-5 py-6">
      {phase === "intro" && (
        <div className="vp-fade-up">
          <div className="mb-5 flex flex-col items-center text-center">
            <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-verify-soft text-verify">
              <Fingerprint className="size-7" />
            </span>
            <h3 className="text-base font-semibold text-ink">Verify your identity</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              Before any money moves, we confirm who you are and issue a signed, verifiable
              certificate that travels with the payment.
            </p>
          </div>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <Avatar name={borrower.displayName} accent={borrower.accent} />
            <div>
              <p className="text-sm font-semibold text-ink">{borrower.profile.legalName}</p>
              <p className="text-xs text-ink-subtle">
                {borrower.profile.documentType} {borrower.profile.documentNumber} ·{" "}
                {borrower.profile.addressCity}
              </p>
            </div>
          </div>
          <Button variant="verify" className="w-full" onClick={onStart}>
            <ShieldCheck className="size-4" />
            Start verification
          </Button>
        </div>
      )}

      {phase === "running" && (
        <div className="vp-fade-up">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-verify-soft text-verify">
              <Spinner className="size-7 vp-spin" />
            </span>
            <h3 className="text-base font-semibold text-ink">Verifying…</h3>
          </div>
          <StageList stages={IDENTITY_STAGES} current={stage} tone="verify" />
        </div>
      )}

      {phase === "issued" && cert && (
        <div className="space-y-4 vp-fade-up">
          <CertificateCard cert={cert} />
          <Button variant="primary" className="w-full" onClick={onContinue}>
            Continue to payment
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}

// --- Review step ------------------------------------------------------------

function ReviewStep({
  amount,
  memo,
  installmentNo,
  total,
  loanRef,
  borrower,
  lender,
  cert,
  onBack,
  onConfirm,
}: {
  amount: number;
  memo: string;
  installmentNo: number;
  total: number;
  loanRef: string;
  borrower: { displayName: string; accent: string; currency: string };
  lender: { displayName: string; accent: string; handle: string };
  cert: IdentityCertificate;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card className="px-5 py-6 vp-fade-up">
      <h3 className="mb-1 text-base font-semibold text-ink">Review your repayment</h3>
      <p className="mb-5 text-sm text-ink-muted">{memo}</p>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={borrower.displayName} accent={borrower.accent} size={38} />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-subtle">From</p>
            <p className="text-sm font-semibold text-ink">{borrower.displayName}</p>
          </div>
        </div>
        <ArrowRight className="text-ink-subtle" />
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-subtle">To</p>
            <p className="text-sm font-semibold text-ink">{lender.displayName}</p>
          </div>
          <Avatar name={lender.displayName} accent={lender.accent} size={38} />
        </div>
      </div>

      <div className="my-4 flex items-end justify-between">
        <span className="text-sm text-ink-muted">Amount</span>
        <span className="text-3xl font-semibold tracking-tight text-ink">
          {formatMoney(amount, borrower.currency)}
        </span>
      </div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-ink-muted">Loan reference</span>
        <span className="font-medium text-ink">{loanRef}</span>
      </div>
      <div className="mb-5 flex items-center justify-between text-sm">
        <span className="text-ink-muted">Installment</span>
        <span className="font-medium text-ink">
          {installmentNo} of {total}
        </span>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-verify-soft bg-verify-soft/50 px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-verify text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Identity verified</p>
          <p className="text-xs text-ink-muted">
            {cert.claims.legalName} · {cert.assuranceLevel} · {cert.issuer}
          </p>
        </div>
        <Badge tone="verify" icon={<Check className="size-3.5" />}>
          Attached
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          <Lock className="size-4" />
          Confirm &amp; pay {formatMoney(amount, borrower.currency)}
        </Button>
      </div>
    </Card>
  );
}

// --- Stage list -------------------------------------------------------------

function StageList({
  stages,
  current,
  tone = "brand",
}: {
  stages: string[];
  current: number;
  tone?: "brand" | "verify";
}) {
  const accent = tone === "verify" ? "verify" : "brand";
  return (
    <ul className="space-y-2">
      {stages.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
              done && "border-line bg-surface-2",
              active && (accent === "verify" ? "border-verify-soft bg-verify-soft/40" : "border-brand-soft bg-brand-soft/40"),
              !done && !active && "border-line opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-white",
                done && "bg-verify",
                active && (accent === "verify" ? "bg-verify" : "bg-brand"),
                !done && !active && "bg-line-strong",
              )}
            >
              {done ? (
                <Check className="size-3.5" />
              ) : active ? (
                <Spinner className="size-3.5 vp-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-white" />
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                done || active ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
