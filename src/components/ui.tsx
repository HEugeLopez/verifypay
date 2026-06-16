"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check, Copy } from "./icons";
import { shortHash } from "@/lib/crypto";
import { initials } from "@/lib/format";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-ink-muted">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-subtle">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

type Variant = "primary" | "verify" | "ghost" | "outline" | "danger" | "warn";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink hover:bg-brand-strong shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]",
  verify:
    "bg-verify text-white hover:bg-verify-strong shadow-[0_6px_16px_-8px_rgba(15,157,107,0.7)]",
  outline: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  warn: "bg-warn text-white hover:opacity-90",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-sm gap-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        variantClass[variant],
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent vp-spin" />
      )}
      {children}
    </button>
  );
}

type Tone = "brand" | "verify" | "success" | "warn" | "danger" | "neutral";

const toneClass: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  verify: "bg-verify-soft text-verify-strong",
  success: "bg-verify-soft text-verify-strong",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-ink-muted",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Avatar({
  name,
  accent,
  size = 40,
}: {
  name: string;
  accent: string;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function HashChip({
  value,
  label,
  edge = 7,
  tone = "neutral",
}: {
  value: string;
  label?: string;
  edge?: number;
  tone?: "neutral" | "verify";
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      onClick={copy}
      title={value}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs transition-colors",
        tone === "verify"
          ? "border-verify-soft bg-verify-soft text-verify-strong"
          : "border-line bg-surface-2 text-ink-muted hover:text-ink",
      )}
    >
      {label && <span className="font-sans text-ink-subtle">{label}</span>}
      <span>{shortHash(value, edge)}</span>
      {copied ? (
        <Check className="size-3.5 text-verify" />
      ) : (
        <Copy className="size-3.5 opacity-50 group-hover:opacity-100" />
      )}
    </button>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
