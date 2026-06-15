"use client";

import { useState } from "react";
import { TopBar, type View } from "@/components/top-bar";
import { Dashboard } from "@/components/dashboard";
import { ProofsView } from "@/components/proofs-view";
import { RepaymentWizard } from "@/components/repayment-wizard";

export default function Page() {
  const [view, setView] = useState<View>("dashboard");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const viewProof = (txId: string) => {
    setSelectedTxId(txId);
    setView("proofs");
  };

  return (
    <div className="flex min-h-full flex-col">
      <TopBar view={view} onView={setView} />
      <main className="flex-1">
        {view === "dashboard" ? (
          <Dashboard onStartRepayment={() => setWizardOpen(true)} onViewProof={viewProof} />
        ) : (
          <ProofsView selectedTxId={selectedTxId} onSelect={setSelectedTxId} />
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-ink-subtle">
        VerifyPay POC · identity-verified payments with cryptographic proofs · all data is mocked
        and stored locally
      </footer>

      {wizardOpen && (
        <RepaymentWizard
          onClose={() => setWizardOpen(false)}
          onViewProof={(txId) => {
            setWizardOpen(false);
            viewProof(txId);
          }}
        />
      )}
    </div>
  );
}
