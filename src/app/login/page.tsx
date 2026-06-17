"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error ?? "Incorrect password");
        setLoading(false);
        return;
      }
      const from = new URLSearchParams(window.location.search).get("from") || "/";
      window.location.href = from.startsWith("/") ? from : "/";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)] vp-pop">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-6">
              <path d="M12 3 5 6v5c0 4.2 2.8 7.5 7 9 4.2-1.5 7-4.8 7-9V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-ink">VerifyPay</h1>
          <p className="text-sm text-ink-muted">Enter the access password to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            className="h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-4 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            {loading && (
              <span className="size-4 rounded-full border-2 border-white border-t-transparent vp-spin" />
            )}
            Unlock
          </button>
        </form>
        <p className="mt-5 text-center text-[11px] text-ink-subtle">build marker-9b2c</p>
      </div>
    </div>
  );
}
