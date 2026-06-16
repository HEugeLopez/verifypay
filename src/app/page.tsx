"use client";

import { useState } from "react";
import { TopBar, type View } from "@/components/top-bar";
import { Dashboard } from "@/components/dashboard";
import { ProofsView } from "@/components/proofs-view";
import { RepaymentWizard } from "@/components/repayment-wizard";
import { PhoneFrame } from "@/components/phone-frame";
import { useApp } from "@/lib/store";

export default function Page() {
  const { activeAccount } = useApp();
  const isBorrower = activeAccount.role === "borrower";

  const [view, setView] = useState<View>("dashboard");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const viewProof = (txId: string) => {
    setSelectedTxId(txId);
    setView("proofs");
  };

  const content =
    view === "dashboard" ? (
      <Dashboard onStartRepayment={() => setWizardOpen(true)} onViewProof={viewProof} />
    ) : (
      <ProofsView selectedTxId={selectedTxId} onSelect={setSelectedTxId} />
    );

  const wizard = wizardOpen ? (
    <RepaymentWizard
      contained={isBorrower}
      onClose={() => setWizardOpen(false)}
      onViewProof={(txId) => {
        setWizardOpen(false);
        viewProof(txId);
      }}
    />
  ) : null;

  return (
    <div className="flex min-h-full flex-col">
      <TopBar view={view} onView={setView} />
      <main className="flex-1">
        {isBorrower ? (
          <PhoneFrame overlay={wizard}>{content}</PhoneFrame>
        ) : (
          <>
            {content}
            {wizard}
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-ink-subtle">
        VerifyPay POC · identity-verified payments with cryptographic proofs
      </footer>
    </div>
  );
}
