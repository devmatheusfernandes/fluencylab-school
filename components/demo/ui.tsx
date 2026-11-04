"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Lightbulb, X } from "lucide-react";

/* ───────── Modo explicação ───────── */

const ExplainContext = createContext(true);
export const ExplainProvider = ExplainContext.Provider;

export function Explain({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const on = useContext(ExplainContext);
  if (!on) return null;
  return (
    <aside className={clsx("flex gap-3 rounded-2xl border border-amber/60 bg-amber/10 p-4 text-sm leading-relaxed", className)}>
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber" aria-hidden />
      <div>
        <p className="font-bold text-ink">{title}</p>
        <div className="mt-1 text-ink/80">{children}</div>
      </div>
    </aside>
  );
}

/* ───────── Peças visuais ───────── */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl border border-line bg-card p-5", className)}>{children}</div>;
}

export function SectionHead({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      {text ? <p className="mt-1 text-muted">{text}</p> : null}
    </div>
  );
}

type Tone = "ok" | "warn" | "danger" | "neutral" | "brand";
const toneClass: Record<Tone, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-stone-100 text-stone-700",
  brand: "bg-brand-soft text-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", toneClass[tone])}>{children}</span>;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50",
        checked ? "bg-brand" : "bg-stone-300",
      )}
    >
      <span className={clsx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function Meter({ label, value, max, unit, hint }: { label: string; value: number; max: number; unit?: string; hint?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-muted">
          {value} de {max} {unit}
        </span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-stone-200" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
        <div className="h-2.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "ink";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-brand text-brand-ink hover:brightness-110",
    ink: "bg-ink text-cream hover:bg-ink-2",
    ghost: "border border-line bg-card text-ink hover:border-ink",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx("inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition disabled:opacity-50", styles, className)}
    >
      {children}
    </button>
  );
}

/* ───────── Modal ───────── */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={clsx("max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl", wide ? "max-w-3xl" : "max-w-lg")}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-ink">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───────── Aviso rápido ───────── */

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3400);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toast = message ? (
    <div role="status" className="fixed bottom-6 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream shadow-xl">
      {message}
    </div>
  ) : null;

  return { notify, toast };
}
