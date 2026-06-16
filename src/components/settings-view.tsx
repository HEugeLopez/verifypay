"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { AmaraAvatar } from "./amara-avatar";
import { Badge, Button, Card, CardHeader, cn } from "./ui";
import { Check, IdCard, Lock, ShieldCheck } from "./icons";

interface Health {
  integrations?: {
    tngIdentity?: { configured?: boolean };
    proof?: { configured?: boolean };
  };
}

export function SettingsView() {
  const { borrower, reset } = useApp();
  const p = borrower.profile;
  const [health, setHealth] = useState<Health | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => active && setHealth(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const tng = health?.integrations?.tngIdentity?.configured;
  const proof = health?.integrations?.proof?.configured;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>

      {/* account */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-4">
          <AmaraAvatar size={44} className="shadow-[var(--shadow-card)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{p.legalName}</p>
            <p className="truncate text-xs text-ink-subtle">{borrower.handle}</p>
          </div>
          <Badge tone="verify" icon={<Check className="size-3.5" />}>
            Verified
          </Badge>
        </div>
      </Card>

      {/* preferences */}
      <Card>
        <CardHeader title="Preferences" />
        <div className="px-5 py-1">
          <Toggle label="Push notifications" on={notifications} onChange={setNotifications} />
          <Toggle label="Biometric unlock" on={biometric} onChange={setBiometric} />
          <Row label="Currency" value="USD" />
          <Row label="Language" value="English" />
        </div>
      </Card>

      {/* connected services */}
      <Card>
        <CardHeader icon={<Lock />} title="Connected services" />
        <div className="px-5 py-2">
          <Service name="TNG Identity" desc="Verifiable credentials" ok={tng} icon={<IdCard className="size-5" />} />
          <Service name="Proof Fabric Protocol" desc="Transaction proofs" ok={proof} icon={<ShieldCheck className="size-5" />} />
        </div>
      </Card>

      {/* about */}
      <Card>
        <CardHeader title="About" />
        <div className="px-5 py-1">
          <Row label="App" value="VerifyPay POC" />
          <Row label="Version" value="1.0.0" />
        </div>
      </Card>

      <Button variant="outline" className="w-full" onClick={reset}>
        Reset demo data
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <button
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-verify" : "bg-line-strong",
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Service({
  name,
  desc,
  ok,
  icon,
}: {
  name: string;
  desc: string;
  ok?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <span className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-ink-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="truncate text-xs text-ink-subtle">{desc}</p>
      </div>
      <Badge tone={ok ? "verify" : "neutral"} icon={ok ? <Check className="size-3.5" /> : undefined}>
        {ok ? "Connected" : "Not set"}
      </Badge>
    </div>
  );
}
