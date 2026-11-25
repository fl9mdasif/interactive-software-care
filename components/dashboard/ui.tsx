"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { AlertCircle, Inbox, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { label as toLabel } from "@/lib/format";

/* ---------- buttons ---------- */

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-55";
const VARIANTS = {
  primary: "bg-acid text-on-accent hover:opacity-90",
  secondary: "border border-line-strong bg-surface-2 text-text hover:border-acid",
  ghost: "text-text-mid hover:bg-tint hover:text-text",
  danger: "border border-danger/50 text-danger hover:bg-danger/10",
};
const SIZES = { md: "h-10 px-4 text-sm", sm: "h-8 px-3 text-xs" };

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

export const buttonClass = (variant: Variant = "primary", size: Size = "md") => cn(BUTTON, VARIANTS[variant], SIZES[size]);

export function Button({
  variant,
  size,
  busy,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean }) {
  return (
    <button type={type} className={cn(buttonClass(variant, size), className)} disabled={disabled || busy} {...props}>
      {busy && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant,
  size,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link href={href} aria-label={ariaLabel} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

/* ---------- form fields ---------- */

const CONTROL =
  "w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-text placeholder:text-text-dim focus:border-acid disabled:opacity-60";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-text-mid">{label}</span>
      {children}
      {hint && <span className="text-xs text-text-dim">{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(CONTROL, "h-10", className)} {...props} />
);

export const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(CONTROL, "min-h-24 py-2", className)} {...props} />
);

export function Select({
  options,
  placeholder,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  return (
    <select className={cn(CONTROL, "h-10", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const option = typeof o === "string" ? { value: o, label: toLabel(o) } : o;
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text-mid">
      <input type="checkbox" className="size-4 accent-[var(--acid)]" {...props} />
      {label}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-52 flex-1">
      <Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-dim" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}

/* ---------- layout ---------- */

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-dim">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  title,
  value,
  note,
  icon: Icon,
  href,
}: {
  title: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between gap-2 text-xs text-text-dim">
        <span>{title}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-2 break-words font-display text-2xl font-semibold">{value}</div>
      {note && <div className="mt-1 text-xs text-text-dim">{note}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/* ---------- table ---------- */

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
}) {
  if (!rows.length) return <EmptyState message={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-text-dim">
            {columns.map((c) => (
              <th key={c.header} scope="col" className={cn("whitespace-nowrap px-3 py-2 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-tint">
              {columns.map((c) => (
                <td key={c.header} className={cn("px-3 py-3 align-middle", c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: { page: number; limit: number; total: number };
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(meta.total / meta.limit));
  if (!meta.total) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-dim">
      <span>
        {meta.total} total · page {meta.page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/* ---------- status ---------- */

const TONES = {
  neutral: "border-line-strong text-text-mid",
  info: "border-violet/50 bg-violet-dim text-text",
  good: "border-acid/50 bg-acid-dim text-text",
  warn: "border-amber-500/60 bg-amber-500/10 text-text",
  bad: "border-danger/60 bg-danger/10 text-text",
};
const STATUS_TONE: Record<string, keyof typeof TONES> = {
  confirmed: "info", in_progress: "info", review: "info", contacted: "info", coming_soon: "info",
  accepted: "good", rejected: "bad",
  live: "good", under_maintenance: "warn", discontinued: "bad",
  delivered: "good", completed: "good", paid: "good", converted: "good", published: "good", active: "good",
  pending: "warn", on_hold: "warn", partial: "warn", new: "warn", high: "warn",
  cancelled: "bad", unpaid: "bad", lost: "bad", urgent: "bad", voided: "bad", deactivated: "bad",
};

export function Badge({ value, children }: { value: string; children?: React.ReactNode }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs", TONES[STATUS_TONE[value] ?? "neutral"])}>
      {children ?? toLabel(value)}
    </span>
  );
}

export const Loading = ({ text = "Loading…" }: { text?: string }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-text-dim">
    <Loader2 className="size-5 animate-spin" />
    {text}
  </div>
);

export const EmptyState = ({ message, children }: { message: string; children?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-text-dim">
    <Inbox className="size-7" />
    <p>{message}</p>
    {children}
  </div>
);

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center text-sm text-text-mid">
      <AlertCircle className="size-7 text-danger" />
      <p>{errorMessage(error)}</p>
      {retry && (
        <Button variant="secondary" size="sm" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export const errorMessage = (error: unknown) =>
  typeof (error as { data?: unknown })?.data === "string" ? (error as { data: string }).data : "Something went wrong.";

/* ---------- dialogs ---------- */

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  // A native modal dialog gives focus trapping and Escape for free.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line-strong bg-surface p-5 text-text backdrop:bg-black/60"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="size-4" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-text-mid">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
