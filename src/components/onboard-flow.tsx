"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { identityApi, proofApi, type PresentationRequest } from "@/lib/api";
import type { IdentityCertificate, Transaction, TransactionProof } from "@/lib/types";
import { hashObject } from "@/lib/crypto";
import { getDemoCredential } from "@/lib/demo-credentials";
import { PhoneFrame } from "./phone-frame";
import { WalletQR } from "./wallet-qr";
import { Button, Card, Badge, HashChip, cn } from "./ui";
import { ShieldCheck, Check } from "./icons";

// ---------------------------------------------------------------------------
// Cross-border "bring your banking history" demo.
// Home bank (Meridian, Lagos) issues a Banking Standing credential → holder
// presents it at the destination bank (Albion, UK) → destination instantly
// approves products a thin-file newcomer would be denied, and seals the
// identity-bound decision with a Proof Fabric artifact.
// ---------------------------------------------------------------------------

const STANDING = getDemoCredential("bankStandingCredential");

type Stage = "welcome" | "issue" | "present" | "decision" | "done";

const STEP_INDEX: Record<Stage, number> = {
  welcome: 0,
  issue: 1,
  present: 2,
  decision: 3,
  done: 4,
};

const uid = (p: string) =>
  `${p}_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10)}`;

// Build a certificate from the demo standing claims (fallback when the live
// present step is skipped or the TNG definition isn't wired yet).
async function buildDemoCert(): Promise<IdentityCertificate> {
  const attributes = (STANDING?.claims ?? []).map((c) => ({
    name: c.claimName,
    value: c.claimValue,
  }));
  const verifiedAt = new Date().toISOString();
  return {
    id: uid("idcert"),
    subjectAccountId: "acct_amara",
    issuer: "Meridian Bank (TNG-issued)",
    method: ["Verifiable credential presentation", "OpenID4VP / SIOP"],
    subject: "Amara Okafor",
    attributes,
    verifiedAt,
    subjectHash: await hashObject(attributes),
    signature: "demo",
    status: "valid",
    source: "tng",
    tng: {
      correlationId: uid("corr"),
      definitionId: "demo-standing",
      credentialId: "bankStandingCredential",
      credentialTypes: ["BankStandingCredential"],
    },
  };
}

export function OnboardFlow() {
  const [stage, setStage] = useState<Stage>("welcome");

  // issue (home bank)
  const [issueState, setIssueState] = useState<"idle" | "loading" | "offered" | "unavailable">("idle");
  const [offerUri, setOfferUri] = useState<string>("");

  // present (destination bank)
  const [presState, setPresState] = useState<"idle" | "awaiting" | "verified" | "error">("idle");
  const [presReq, setPresReq] = useState<PresentationRequest | null>(null);
  const [presNote, setPresNote] = useState<string>("");
  const [cert, setCert] = useState<IdentityCertificate | null>(null);
  const pollRef = useRef<{ stop: boolean }>({ stop: false });

  // decision / proof
  const [proof, setProof] = useState<TransactionProof | null>(null);
  const [proofState, setProofState] = useState<"idle" | "sealing" | "done">("idle");

  useEffect(() => () => { pollRef.current.stop = true; }, []);

  // --- issue ---------------------------------------------------------------
  const runIssue = useCallback(async () => {
    setIssueState("loading");
    try {
      const res = await fetch("/api/identity/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: "bankStandingCredential" }),
      });
      const data = await res.json();
      if (data?.ok && data.offer?.claimUri) {
        setOfferUri(data.offer.claimUri);
        setIssueState("offered");
      } else {
        setIssueState("unavailable");
      }
    } catch {
      setIssueState("unavailable");
    }
  }, []);

  // --- present -------------------------------------------------------------
  const poll = useCallback(async (req: PresentationRequest) => {
    if (pollRef.current.stop) return;
    try {
      const result = await identityApi.pollStatus({ id: "acct_amara" } as never, req);
      if (pollRef.current.stop) return;
      if (result.status === "valid" && result.cert) {
        setCert(result.cert);
        setPresState("verified");
        return;
      }
      if (result.status === "failed" || result.status === "error") {
        setPresNote("The wallet reported the presentation could not be completed.");
        setPresState("error");
        return;
      }
    } catch {
      /* transient — keep polling */
    }
    setTimeout(() => poll(req), 2500);
  }, []);

  const runPresent = useCallback(async () => {
    setPresNote("");
    setPresState("awaiting");
    pollRef.current.stop = false;
    try {
      const req = await identityApi.startVerification();
      setPresReq(req);
      poll(req);
    } catch (e) {
      setPresNote(e instanceof Error ? e.message : "Could not start the presentation.");
      setPresState("error");
    }
  }, [poll]);

  const skipToDemoStanding = useCallback(async () => {
    pollRef.current.stop = true;
    setCert(await buildDemoCert());
    setPresState("verified");
  }, []);

  // --- decision proof (PFP) ------------------------------------------------
  const sealDecision = useCallback(async (c: IdentityCertificate) => {
    setProofState("sealing");
    const tx: Transaction = {
      id: uid("tx"),
      kind: "disbursement",
      fromAccountId: "albion_bank_uk",
      toAccountId: "acct_amara",
      amount: 4000,
      currency: "GBP",
      memo: "Credit facility approved — Albion Bank, on verified cross-border standing",
      createdAt: new Date().toISOString(),
      status: "settled",
      certificateId: c.id,
    };
    const p = await proofApi.createTransactionProof(tx, c);
    setProof(p);
    setProofState("done");
  }, []);

  const goDecision = useCallback(() => {
    setStage("decision");
    if (cert && proofState === "idle") sealDecision(cert);
  }, [cert, proofState, sealDecision]);

  // ------------------------------------------------------------------------
  const stepN = STEP_INDEX[stage];
  const standingAttrs = cert?.attributes ?? (STANDING?.claims ?? []).map((c) => ({ name: c.claimName, value: c.claimValue }));
  const attr = (n: string) => standingAttrs.find((a) => a.name.toLowerCase() === n.toLowerCase())?.value;

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-ink">
            <ShieldCheck className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Albion Bank · Newcomer onboarding</p>
            <p className="text-xs text-ink-subtle">Bring your banking history</p>
          </div>
        </div>
        <Badge tone="brand">Cross-border identity demo</Badge>
      </header>

      <main className="flex-1">
        <PhoneFrame>
          <div className="flex min-h-full flex-col px-5 pb-8 pt-3">
            {/* stepper */}
            {stage !== "welcome" && (
              <div className="mb-4 flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      stepN >= i ? "bg-brand" : "bg-line",
                    )}
                  />
                ))}
              </div>
            )}

            {stage === "welcome" && <Welcome onStart={() => setStage("issue")} />}

            {stage === "issue" && (
              <IssueStep
                state={issueState}
                offerUri={offerUri}
                onIssue={runIssue}
                onContinue={() => setStage("present")}
              />
            )}

            {stage === "present" && (
              <PresentStep
                state={presState}
                req={presReq}
                note={presNote}
                cert={cert}
                onPresent={runPresent}
                onRetry={runPresent}
                onSkip={skipToDemoStanding}
                onContinue={goDecision}
              />
            )}

            {stage === "decision" && (
              <DecisionStep
                fullName={attr("fullName") ?? "Amara Okafor"}
                customerSince={attr("customerSince") ?? "2013"}
                principalBank={attr("principalBank") ?? "Meridian Bank, Lagos"}
                standing={attr("accountStanding") ?? "Good standing"}
                history={attr("paymentHistory") ?? "No defaults · 12 yrs on-time"}
                proof={proof}
                proofState={proofState}
                onDone={() => setStage("done")}
              />
            )}

            {stage === "done" && <DoneStep onRestart={() => location.reload()} />}
          </div>
        </PhoneFrame>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-ink-subtle">
        Identity issued &amp; presented via TNG · decision sealed with Proof Fabric · demo data
      </footer>
    </div>
  );
}

// === Stages ================================================================

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col vp-fade-up">
      <div className="mt-2 flex flex-1 flex-col justify-center">
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          New to the UK?
          <br />
          Bring your banking history.
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Most newcomers start as a &ldquo;thin file&rdquo; — rejected, deposit-gated, charged more.
          Present a verified standing credential from your home bank and Albion Bank can onboard you
          in minutes.
        </p>
        <ul className="mt-5 space-y-2.5">
          {[
            "Your home bank vouches for your real history",
            "Cryptographically verified, bound to your identity",
            "Unlock a real credit card & mortgage — not a secured card",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-sm text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-verify" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Button className="mt-6 w-full" size="lg" onClick={onStart}>
        Get started
      </Button>
    </div>
  );
}

function StepHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{kicker}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {sub && <p className="mt-1.5 text-sm text-ink-muted">{sub}</p>}
    </div>
  );
}

function StandingCard() {
  return (
    <div
      className="rounded-2xl p-4 text-white shadow-[var(--shadow-card)]"
      style={{ background: STANDING?.gradient }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">Banking Standing</span>
        <ShieldCheck className="size-5 opacity-90" />
      </div>
      <p className="mt-6 text-lg font-semibold">Amara Okafor</p>
      <p className="text-sm opacity-85">{STANDING?.issuer}</p>
      <div className="mt-3 flex items-center justify-between text-xs opacity-90">
        <span>Customer since 2013</span>
        <span>No defaults · 12 yrs</span>
      </div>
    </div>
  );
}

function IssueStep({
  state,
  offerUri,
  onIssue,
  onContinue,
}: {
  state: "idle" | "loading" | "offered" | "unavailable";
  offerUri: string;
  onIssue: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col vp-fade-up">
      <StepHead
        kicker="Step 1 · Your home bank"
        title="Issue your standing"
        sub="Meridian Bank, Lagos signs a verifiable credential of your 12-year relationship into your wallet."
      />
      <div className="mb-4">
        <StandingCard />
      </div>

      {state === "idle" && (
        <Button className="w-full" onClick={onIssue}>
          Issue my standing credential
        </Button>
      )}

      {state === "loading" && (
        <Button className="w-full" loading disabled>
          Contacting Meridian Bank…
        </Button>
      )}

      {state === "offered" && (
        <div className="flex flex-col items-center vp-pop">
          <p className="mb-3 text-center text-sm text-ink-muted">
            Scan with your wallet to claim the credential.
          </p>
          <WalletQR value={offerUri} size={196} />
          <Button className="mt-5 w-full" onClick={onContinue}>
            I&apos;ve claimed it — continue
          </Button>
        </div>
      )}

      {state === "unavailable" && (
        <div className="vp-fade-up">
          <Card className="mb-4 bg-warn-soft px-4 py-3">
            <p className="text-sm font-medium text-warn">Live issuance not wired yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              The <span className="font-mono">bankStandingCredential</span> schema isn&apos;t in this
              TNG tenant. Continuing in demo mode with the standing above.
            </p>
          </Card>
          <Button className="w-full" onClick={onContinue}>
            Continue
          </Button>
        </div>
      )}

      {state === "idle" && (
        <button onClick={onContinue} className="mx-auto mt-3 text-xs text-ink-subtle underline">
          Skip — I already hold it
        </button>
      )}
    </div>
  );
}

function PresentStep({
  state,
  req,
  note,
  cert,
  onPresent,
  onRetry,
  onSkip,
  onContinue,
}: {
  state: "idle" | "awaiting" | "verified" | "error";
  req: PresentationRequest | null;
  note: string;
  cert: IdentityCertificate | null;
  onPresent: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col vp-fade-up">
      <StepHead
        kicker="Step 2 · Albion Bank"
        title="Present your standing"
        sub="Albion verifies the credential's signature and that it belongs to you — across the border."
      />

      {state === "idle" && (
        <>
          <div className="mb-4"><StandingCard /></div>
          <Button className="w-full" variant="verify" onClick={onPresent}>
            Present to Albion Bank
          </Button>
          <button onClick={onSkip} className="mx-auto mt-3 text-xs text-ink-subtle underline">
            Use demo standing instead
          </button>
        </>
      )}

      {state === "awaiting" && (
        <div className="flex flex-col items-center vp-pop">
          <p className="mb-3 text-center text-sm text-ink-muted">
            Scan with your wallet to present your Banking Standing credential.
          </p>
          {req ? (
            <WalletQR value={req.authRequestURI} size={196} />
          ) : (
            <div className="size-[196px] animate-pulse rounded-xl bg-surface-2" />
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
            <span className="size-4 rounded-full border-2 border-current border-t-transparent vp-spin" />
            Waiting for the wallet…
          </div>
          <button onClick={onSkip} className="mt-4 text-xs text-ink-subtle underline">
            Use demo standing instead
          </button>
        </div>
      )}

      {state === "verified" && cert && (
        <div className="flex flex-1 flex-col vp-pop">
          <Card className="mb-4 border-verify-soft bg-verify-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-verify text-white">
                <Check className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-verify-strong">Standing verified</p>
                <p className="text-xs text-ink-muted">{cert.issuer}</p>
              </div>
            </div>
          </Card>
          <div className="space-y-1.5">
            {cert.attributes.slice(0, 6).map((a) => (
              <div key={a.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">{a.name}</span>
                <span className="text-right font-medium text-ink">{a.value}</span>
              </div>
            ))}
          </div>
          <Button className="mt-auto w-full" onClick={onContinue}>
            See what this unlocks
          </Button>
        </div>
      )}

      {state === "error" && (
        <div className="vp-fade-up">
          <Card className="mb-4 bg-danger-soft px-4 py-3">
            <p className="text-sm font-medium text-danger">Presentation didn&apos;t complete</p>
            {note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}
          </Card>
          <Button className="w-full" onClick={onRetry}>Try again</Button>
          <button onClick={onSkip} className="mx-auto mt-3 block text-xs text-ink-subtle underline">
            Use demo standing instead
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  icon,
  product,
  approved,
  detail,
  before,
}: {
  icon: ReactNode;
  product: string;
  approved: string;
  detail: string;
  before: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{product}</p>
          <p className="text-xs text-ink-subtle">{detail}</p>
        </div>
        <Badge tone="success" icon={<Check className="size-3.5" />}>Approved</Badge>
      </div>
      <p className="px-4 pt-2 text-xl font-semibold tracking-tight text-ink">{approved}</p>
      <div className="mt-3 border-t border-line bg-surface-2 px-4 py-2.5">
        <p className="text-xs text-ink-subtle">
          <span className="font-medium text-ink-muted">Without portable standing:</span>{" "}
          <span className="line-through">{before}</span>
        </p>
      </div>
    </Card>
  );
}

function DecisionStep({
  fullName,
  customerSince,
  principalBank,
  standing,
  history,
  proof,
  proofState,
  onDone,
}: {
  fullName: string;
  customerSince: string;
  principalBank: string;
  standing: string;
  history: string;
  proof: TransactionProof | null;
  proofState: "idle" | "sealing" | "done";
  onDone: () => void;
}) {
  const live = proof?.source === "pfp";
  return (
    <div className="flex flex-1 flex-col vp-fade-up">
      <StepHead
        kicker="Step 3 · Decision"
        title={`Welcome, ${fullName.split(" ")[0]}`}
        sub={`Your verified standing at ${principalBank} (customer since ${customerSince}, ${standing.toLowerCase()}) unlocks:`}
      />

      <div className="space-y-3">
        <ProductCard
          icon={<CardIcon />}
          product="Credit card"
          detail="Instant decision · no deposit"
          approved="£4,000 limit · 22.9% APR"
          before="Secured card · £200 deposit · £200 limit"
        />
        <ProductCard
          icon={<HouseIcon />}
          product="Mortgage"
          detail="Pre-qualified · 10% deposit"
          approved="Up to £320,000 · 4.8% prime"
          before="Declined — no UK credit history"
        />
      </div>

      {/* proof seal */}
      <Card className="mt-3 px-4 py-3">
        {proofState !== "done" ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="size-4 rounded-full border-2 border-current border-t-transparent vp-spin" />
            Sealing the identity-bound decision…
          </div>
        ) : (
          <div className="vp-pop">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Decision proof</p>
              <Badge tone={live ? "verify" : "neutral"} icon={<ShieldCheck className="size-3.5" />}>
                {live ? "Live · Proof Fabric" : "Local proof"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {history} — bound to this approval in a tamper-evident proof.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {proof?.feaId && <HashChip label="FEA" value={proof.feaId} />}
              {proof?.proofHash && <HashChip label="proof" value={proof.proofHash} tone="verify" />}
            </div>
          </div>
        )}
      </Card>

      <Button className="mt-4 w-full" size="lg" disabled={proofState !== "done"} onClick={onDone}>
        Accept &amp; open my account
      </Button>
    </div>
  );
}

function DoneStep({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center vp-pop">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-verify text-white vp-pulse-ring">
        <Check className="size-8" />
      </span>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">You&apos;re all set</h2>
      <p className="mt-2 max-w-[16rem] text-sm text-ink-muted">
        Albion Bank onboarded you and approved your products in minutes — because your standing
        travelled with you, verified.
      </p>
      <button onClick={onRestart} className="mt-8 text-sm font-medium text-brand underline">
        Run the demo again
      </button>
    </div>
  );
}

// === inline product icons ===================================================
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}
