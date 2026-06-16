"use client";

import { useState } from "react";
import { TopBar, type View } from "@/components/top-bar";
import { Dashboard } from "@/components/dashboard";
import { ActivityView } from "@/components/activity-view";
import { ProofsView } from "@/components/proofs-view";
import { RepaymentWizard } from "@/components/repayment-wizard";
import { ProfileSheet } from "@/components/profile-sheet";
import { PhoneFrame } from "@/components/phone-frame";
import { PhoneNav } from "@/components/phone-nav";
import { useApp } from "@/lib/store";

export default function Page() {
  const { activeAccount } = useApp();
  const isBorrower = activeAccount.role === "borrower";

  const [view, setView] = useState<View>("dashboard");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const viewProof = (txId: string) => {
    setSelectedTxId(txId);
    setView("proofs");
  };

  const content =
    view === "dashboard" ? (
      <Dashboard
        onStartRepayment={() => setWizardOpen(true)}
        onViewProof={viewProof}
        onOpenProfile={() => setProfileOpen(true)}
      />
    ) : view === "activity" ? (
      <ActivityView onViewProof={viewProof} />
    ) : (
      <ProofsView selectedTxId={selectedTxId} onSelect={setSelectedTxId} />
    );

  const overlay = wizardOpen ? (
    <RepaymentWizard
      contained={isBorrower}
      onClose={() => setWizardOpen(false)}
      onViewProof={(txId) => {
        setWizardOpen(false);
        viewProof(txId);
      }}
    />
  ) : profileOpen ? (
    <ProfileSheet onClose={() => setProfileOpen(false)} />
  ) : null;

  return (
    <div className="flex min-h-full flex-col">
      <TopBar view={view} onView={setView} showNav={!isBorrower} />
      <main className="flex-1">
        {isBorrower ? (
          <PhoneFrame
            overlay={overlay}
            bottomBar={
              <PhoneNav
                active={view}
                onHome={() => setView("dashboard")}
                onActivity={() => setView("activity")}
                onProfile={() => setProfileOpen(true)}
                onNew={() => setWizardOpen(true)}
              />
            }
          >
            {content}
          </PhoneFrame>
        ) : (
          <>
            {content}
            {overlay}
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-ink-subtle">
        VerifyPay POC · identity-verified payments with cryptographic proofs
      </footer>
    </div>
  );
}
