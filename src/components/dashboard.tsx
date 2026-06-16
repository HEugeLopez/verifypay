"use client";

import { useApp } from "@/lib/store";
import { formatDate, formatMoney, relativeTime } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";
import { Avatar, Badge, Button, Card, CardHeader, cn } from "./ui";
import { AmaraAvatar } from "./amara-avatar";
import {
  ArrowRight,
  Building,
  Check,
  ChevronDown,
  Clock,
  Lock,
  Plus,
  ShieldCheck,
  User,
  Wallet as WalletIcon,
} from "./icons";

export function Dashboard({
  onStartRepayment,
  onViewProof,
  onOpenProfile,
}: {
  onStartRepayment: () => void;
  onViewProof: (txId: string) => void;
  onOpenProfile: () => void;
}) {
  const { activeAccount, borrower, lender, loan, transactions } = useApp();
  const isBorrower = activeAccount.role === "borrower";

  const relevant = transactions.filter(
    (t) => t.fromAccountId === activeAccount.id || t.toAccountId === activeAccount.id,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* greeting */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        {isBorrower ? (
          <button
            onClick={onOpenProfile}
            className="group flex items-center gap-3 rounded-2xl py-1 pr-2 text-left transition-colors hover:bg-surface-2/70 active:scale-[0.99]"
          >
            <AmaraAvatar size={46} className="rounded-full shadow-[var(--shadow-card)]" />
            <div>
              <p className="text-sm text-ink-muted">Borrower workspace</p>
              <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-ink">
                Hello, Amara
                <ChevronDown className="size-4 -rotate-90 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
              </h1>
            </div>
          </button>
        ) : (
          <div>
            <p className="text-sm text-ink-muted">Lender workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Northwind Capital</h1>
          </div>
        )}
        {isBorrower ? (
          <Button onClick={onStartRepayment}>
            <Plus className="size-4" />
            Make a repayment
          </Button>
        ) : (
          <Badge tone="brand" icon={<Building className="size-3.5" />}>
            Loan servicing
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <WalletCard account={activeAccount} />
          {isBorrower ? (
            <BorrowerLoanCard onStartRepayment={onStartRepayment} />
          ) : (
            <LenderLoanCard />
          )}
          <TransactionHistory
            transactions={relevant}
            activeAccount={activeAccount}
            counterpartyFor={(t) =>
              t.fromAccountId === activeAccount.id
                ? lender.id === t.toAccountId
                  ? lender
                  : borrower
                : t.fromAccountId === borrower.id
                  ? borrower
                  : lender
            }
            onViewProof={onViewProof}
          />
        </div>
        <div className="min-w-0 space-y-4">
          {/* Borrower's profile lives in the tap-to-open profile sheet, not here */}
          {!isBorrower && <ProfileCard account={activeAccount} />}
          <CounterpartyCard account={isBorrower ? lender : borrower} loanRef={loan.reference} />
        </div>
      </div>
    </div>
  );
}

// --- Wallet -----------------------------------------------------------------

function WalletCard({ account }: { account: Account }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gradient-to-br from-ink to-[#1c2a44] px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <WalletIcon className="size-4" />
            Wallet balance
          </div>
          <Badge tone="neutral" className="bg-white/15 text-white">
            {account.currency}
          </Badge>
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight">
          {formatMoney(account.balance, account.currency)}
        </p>
        <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
          <Avatar name={account.displayName} accent={account.accent} size={28} />
          {account.displayName} · {account.handle}
        </div>
      </div>
    </Card>
  );
}

// --- Borrower loan ----------------------------------------------------------

function BorrowerLoanCard({ onStartRepayment }: { onStartRepayment: () => void }) {
  const { loan } = useApp();
  const pct = Math.round((loan.installmentsPaid / loan.installmentsTotal) * 100);
  const paid = loan.principal - loan.outstanding;

  return (
    <Card>
      <CardHeader
        icon={<Building />}
        title="Personal loan"
        subtitle={`${loan.reference} · Northwind Capital`}
        action={<Badge tone="brand">{(loan.apr * 100).toFixed(1)}% APR</Badge>}
      />
      <div className="px-5 py-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-ink-subtle">Outstanding balance</p>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {formatMoney(loan.outstanding)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-subtle">Monthly installment</p>
            <p className="text-lg font-semibold text-ink">{formatMoney(loan.installment)}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
            <span>
              {loan.installmentsPaid} of {loan.installmentsTotal} installments
            </span>
            <span>{formatMoney(paid)} repaid</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-verify"
              style={{ width: `${pct}%`, animation: "vp-bar 0.8s ease" }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-warn-soft bg-warn-soft/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-warn">
            <Clock className="size-4" />
            Next payment due {formatDate(loan.nextDueDate)}
          </div>
          <Button variant="warn" className="mt-3 w-full" onClick={onStartRepayment}>
            Pay {formatMoney(loan.installment)}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// --- Lender loan ------------------------------------------------------------

function LenderLoanCard() {
  const { loan } = useApp();
  const pct = Math.round((loan.installmentsPaid / loan.installmentsTotal) * 100);
  const collected = loan.principal - loan.outstanding;

  return (
    <Card>
      <CardHeader
        icon={<User />}
        title="Loan receivable"
        subtitle={`${loan.reference} · Amara Okafor`}
        action={<Badge tone="brand">{(loan.apr * 100).toFixed(1)}% APR</Badge>}
      />
      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Outstanding" value={formatMoney(loan.outstanding)} />
          <Stat label="Collected" value={formatMoney(collected)} tone="verify" />
          <Stat label="Principal" value={formatMoney(loan.principal)} />
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
            <span>Repayment progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-verify to-brand"
              style={{ width: `${pct}%`, animation: "vp-bar 0.8s ease" }}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">
          <Clock className="size-4" />
          Next installment expected {formatDate(loan.nextDueDate)}
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "verify";
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold", tone === "verify" ? "text-verify-strong" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}

// --- Profile ----------------------------------------------------------------

function ProfileCard({ account }: { account: Account }) {
  const p = account.profile;
  const isOrg = account.role === "lender";
  return (
    <Card>
      <CardHeader icon={isOrg ? <Building /> : <User />} title="Profile" subtitle={account.handle} />
      <div className="flex items-center gap-3 px-5 pt-4">
        <Avatar name={account.displayName} accent={account.accent} size={48} />
        <div>
          <p className="text-sm font-semibold text-ink">{p.legalName}</p>
          <p className="text-xs text-ink-subtle">{p.email}</p>
        </div>
      </div>
      <div className="px-5 py-4 text-sm">
        <Row label={isOrg ? "Incorporated" : "Date of birth"} value={formatDate(p.dateOfBirth)} />
        <Row label="Nationality" value={p.nationality} />
        <Row label="Document" value={`${p.documentType} ${p.documentNumber}`} />
        <Row label="Location" value={p.addressCity} />
      </div>
    </Card>
  );
}

function CounterpartyCard({ account, loanRef }: { account: Account; loanRef: string }) {
  return (
    <Card>
      <CardHeader
        icon={account.role === "lender" ? <Building /> : <User />}
        title="Counterparty"
        subtitle={loanRef}
      />
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar name={account.displayName} accent={account.accent} size={42} />
        <div>
          <p className="text-sm font-semibold text-ink">{account.displayName}</p>
          <p className="text-xs text-ink-subtle">{account.profile.addressCity}</p>
        </div>
      </div>
    </Card>
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

// --- Transactions -----------------------------------------------------------

function TransactionHistory({
  transactions,
  activeAccount,
  counterpartyFor,
  onViewProof,
}: {
  transactions: Transaction[];
  activeAccount: Account;
  counterpartyFor: (t: Transaction) => Account;
  onViewProof: (txId: string) => void;
}) {
  return (
    <Card>
      <CardHeader icon={<Clock />} title="Transaction history" subtitle={`${transactions.length} payments`} />
      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-subtle">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {transactions.map((t) => {
            const outgoing = t.fromAccountId === activeAccount.id;
            const cp = counterpartyFor(t);
            const hasProof = Boolean(t.proofId);
            return (
              <li key={t.id}>
                <button
                  onClick={() => hasProof && onViewProof(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
                    hasProof ? "hover:bg-surface-2" : "cursor-default",
                  )}
                >
                  <Avatar name={cp.displayName} accent={cp.accent} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {outgoing ? "To" : "From"} {cp.displayName}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">{t.memo}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        outgoing ? "text-ink" : "text-verify-strong",
                      )}
                    >
                      {outgoing ? "−" : "+"}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasProof ? (
                        <Badge tone="verify" icon={<ShieldCheck className="size-3" />}>
                          Proof
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-ink-subtle">{relativeTime(t.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  {hasProof && <ArrowRight className="size-4 text-ink-subtle" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
