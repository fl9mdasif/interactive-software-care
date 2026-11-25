"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactMoney, label, money } from "@/lib/format";
import type { TSalesPoint } from "@/types";
import { EmptyState } from "../ui";

const bucket = (date: string) => {
  if (date.length === 4) return date;
  const d = new Date(`${date.length === 7 ? `${date}-01` : date}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
    ...(date.length === 7 ? { year: "2-digit" } : { day: "numeric" }),
  });
};

/** Money received per period. One series, so the card title is its legend. */
export function SalesChart({ data }: { data: TSalesPoint[] }) {
  if (!data.some((d) => d.amount)) return <EmptyState message="No payments in this period." />;
  return (
    <div className="h-72 w-full" role="img" aria-label="Bar chart of money received over time">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={bucket} tick={{ fill: "var(--text-dim)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--border-strong)" }} minTickGap={12} />
          <YAxis tickFormatter={compactMoney} tick={{ fill: "var(--text-dim)", fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
          <Tooltip
            cursor={{ fill: "var(--tint-4)" }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as TSalesPoint | undefined;
              if (!active || !point) return null;
              return (
                <div className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-xs shadow-[var(--shadow-pop)]">
                  <p className="text-text-dim">{bucket(point.date)}</p>
                  <p className="text-sm font-semibold">{money(point.amount)}</p>
                  <p className="text-text-dim">
                    {point.count} payment{point.count === 1 ? "" : "s"}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" fill="var(--violet)" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars with every value written beside its name. */
export function BarList({
  rows,
  format,
  empty = "No data in this period.",
}: {
  rows: { key: string; value: number; note?: string }[];
  format: (value: number) => string;
  empty?: string;
}) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (!max) return <EmptyState message={empty} />;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key} title={`${label(r.key)}: ${format(r.value)}`}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{label(r.key)}</span>
            <span className="whitespace-nowrap">
              {format(r.value)}
              {r.note && <span className="ml-2 text-xs text-text-dim">{r.note}</span>}
            </span>
          </div>
          <div className="h-2 rounded-r bg-tint">
            <div className="h-full rounded-r bg-violet" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
