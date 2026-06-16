"use client";

import { useApp } from "@/lib/store";
import { formatMoney, relativeTime } from "@/lib/format";
import { Avatar, Badge, Card, CardHeader, cn } from "./ui";
import { ArrowRight, Clock, ShieldCheck } from "./icons";

// Borrower's transaction history as a dedicated screen (bottom-nav "Activity").
export function ActivityView({ onViewProof }: { onViewProof: (txId: string) => void }) {
  const { borrower, lender, transactions } = useApp();
  const txs = transactions.filter(
    (t) => t.fromAccountId === borrower.id || t.toAccountId === borrower.id,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-ink">Activity</h1>
      <Card>
        <CardHeader icon={<Clock />} title="Transactions" subtitle={`${txs.length} payments`} />
        {txs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-subtle">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {txs.map((t) => {
              const outgoing = t.fromAccountId === borrower.id;
              const cp = outgoing ? lender : borrower;
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
                      {hasProof ? (
                        <Badge tone="verify" icon={<ShieldCheck className="size-3" />}>
                          Proof
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-ink-subtle">{relativeTime(t.createdAt)}</span>
                      )}
                    </div>
                    {hasProof && <ArrowRight className="size-4 text-ink-subtle" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
