"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Download, HandCoins, Hourglass, TrendingUp, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { downloadCsv } from "@/lib/csv";
import { formatDate, label, money, toDay } from "@/lib/format";
import { useGetOrdersQuery } from "@/redux/api/orderApi";
import {
  useGetSalesBreakdownQuery,
  useGetSalesSeriesQuery,
  useGetSalesSummaryQuery,
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
} from "@/redux/api/salesApi";
import type { TOrder, TTransaction } from "@/types";
import { BarList, SalesChart } from "./charts/Charts";
import { Button, Card, Column, errorMessage, ErrorState, Field, Input, Loading, PageHeader, Pagination, Select, StatCard, Table } from "./ui";

type Period = "day" | "month" | "year";

const daysBefore = (days: number) => toDay(new Date(Date.now() - days * 86_400_000));

const presets = () => {
  const today = toDay();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastEnd = toDay(new Date(new Date(`${monthStart}T12:00:00+06:00`).getTime() - 86_400_000));
  return [
    { name: "Last 30 days", from: daysBefore(29), to: today },
    { name: "This month", from: monthStart, to: today },
    { name: "Last month", from: `${lastEnd.slice(0, 7)}-01`, to: lastEnd },
    { name: "This year", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
};

export const change = (now: number, before: number) =>
  before ? `${now >= before ? "▲" : "▼"} ${Math.abs(((now - before) / before) * 100).toFixed(0)}% vs last month` : "No sales last month";

const TRANSACTION_COLUMNS: Column<TTransaction>[] = [
  { header: "Date", cell: (t) => <span className="whitespace-nowrap">{formatDate(t.paidAt)}</span> },
  {
    header: "Order",
    cell: (t) => (
      <Link href={`/dashboard/orders/${t.orderId}`} className="block min-w-44 hover:text-acid">
        {t.title}
        <span className="block font-mono text-xs text-text-dim">{t.orderNo}</span>
      </Link>
    ),
  },
  { header: "Customer", cell: (t) => t.customer },
  {
    header: "Method",
    cell: (t) => (
      <>
        {label(t.method)}
        {t.trxId && <span className="block font-mono text-xs text-text-dim">{t.trxId}</span>}
      </>
    ),
  },
  {
    header: "Amount",
    cell: (t) => (
      <span className="whitespace-nowrap">
        {money(t.amountBdt)}
        {t.currency === "USD" && <span className="block text-xs text-text-dim">{money(t.amount, "USD")} @ {t.exchangeRate}</span>}
      </span>
    ),
    className: "text-right",
  },
];

const DUE_COLUMNS: Column<TOrder>[] = [
  {
    header: "Order",
    cell: (o) => (
      <Link href={`/dashboard/orders/${o._id}`} className="block min-w-44 hover:text-acid">
        {o.title}
        <span className="block font-mono text-xs text-text-dim">{o.orderNo}</span>
      </Link>
    ),
  },
  { header: "Customer", cell: (o) => o.customer.name },
  { header: "Total", cell: (o) => money(o.total, o.currency), className: "text-right whitespace-nowrap" },
  { header: "Due", cell: (o) => <b>{money(o.dueAmount, o.currency)}</b>, className: "text-right whitespace-nowrap" },
];

export function SalesPage() {
  const [range, setRange] = useState(() => {
    const { from, to } = presets()[3];
    return { from, to };
  });
  const [period, setPeriod] = useState<Period>("month");
  const [by, setBy] = useState<"method" | "type" | "source" | "staff">("method");
  const [page, setPage] = useState(1);
  const [duePage, setDuePage] = useState(1);
  const [asTable, setAsTable] = useState(false);

  const summary = useGetSalesSummaryQuery(range);
  const series = useGetSalesSeriesQuery({ ...range, period });
  const breakdown = useGetSalesBreakdownQuery({ ...range, by });
  const transactions = useGetTransactionsQuery({ ...range, page, limit: 15 });
  const dues = useGetOrdersQuery({ due: "true", page: duePage, limit: 10 });
  const [fetchTransactions, exporting] = useLazyGetTransactionsQuery();

  const pick = (from: string, to: string) => {
    setRange({ from, to });
    setPage(1);
    // A short range reads better by day.
    setPeriod((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000 <= 62 ? "day" : "month");
  };

  const exportCsv = async () => {
    const rows: TTransaction[] = [];
    try {
      for (let next = 1; ; next++) {
        const result = await fetchTransactions({ ...range, page: next, limit: 200 }).unwrap();
        rows.push(...result.items);
        if (rows.length >= result.meta.total || !result.items.length) break;
      }
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    downloadCsv(`isc-sales-${range.from}-to-${range.to}.csv`, [
      ["Date", "Order", "Title", "Customer", "Method", "Transaction ID", "Currency", "Amount", "Rate", "Amount BDT"],
      ...rows.map((t) => [toDay(t.paidAt), t.orderNo, t.title, t.customer, label(t.method), t.trxId ?? "", t.currency, t.amount, t.exchangeRate, t.amountBdt]),
    ]);
  };

  if (summary.error) return <ErrorState error={summary.error} retry={summary.refetch} />;
  const s = summary.data;

  return (
    <>
      <PageHeader title="Sales" description="Money actually received, shown in taka. Dates follow Bangladesh time.">
        <Button variant="secondary" onClick={exportCsv} busy={exporting.isFetching} disabled={!transactions.data?.meta.total}>
          <Download className="size-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        {presets().map((p) => (
          <Button
            key={p.name}
            size="sm"
            variant={range.from === p.from && range.to === p.to ? "primary" : "secondary"}
            aria-pressed={range.from === p.from && range.to === p.to}
            onClick={() => pick(p.from, p.to)}
          >
            {p.name}
          </Button>
        ))}
        <Field label="From">
          <Input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && pick(e.target.value, range.to)} />
        </Field>
        <Field label="To">
          <Input type="date" value={range.to} min={range.from} max={toDay()} onChange={(e) => e.target.value && pick(range.from, e.target.value)} />
        </Field>
      </div>

      {!s ? (
        <Loading />
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Received in selected range" value={money(s.period.amount)} note={`${s.period.count} payments`} icon={Wallet} />
          <StatCard title="This month" value={money(s.month.amount)} note={change(s.month.amount, s.previousMonth.amount)} icon={TrendingUp} />
          <StatCard title="Today" value={money(s.today.amount)} note={`${s.today.count} payments`} icon={CalendarCheck} />
          <StatCard title="Outstanding due" value={money(s.due.amount)} note={`${s.due.count} orders`} icon={Hourglass} />
          <StatCard title="Order value booked in range" value={money(s.booked.amount)} note={`${s.booked.count} confirmed orders · all-time received ${money(s.allTime.amount)}`} icon={HandCoins} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card
          title="Received over time"
          action={
            <div className="flex gap-2">
              <Select className="h-8 w-28 text-xs" aria-label="Group by" value={period} onChange={(e) => setPeriod(e.target.value as Period)} options={[{ value: "day", label: "Daily" }, { value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }]} />
              <Button variant="ghost" size="sm" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
                {asTable ? "Chart" : "Table"}
              </Button>
            </div>
          }
        >
          {!series.data ? (
            <Loading />
          ) : asTable ? (
            <div className="max-h-72 overflow-y-auto">
              <Table
                rows={series.data.filter((p) => p.amount)}
                rowKey={(p) => p.date}
                empty="No payments in this period."
                columns={[
                  { header: "Period", cell: (p) => p.date },
                  { header: "Payments", cell: (p) => p.count, className: "text-right" },
                  { header: "Received", cell: (p) => money(p.amount), className: "text-right" },
                ]}
              />
            </div>
          ) : (
            <SalesChart data={series.data} />
          )}
        </Card>
        <Card
          title="Where it came from"
          action={
            <Select className="h-8 w-36 text-xs" aria-label="Break down by" value={by} onChange={(e) => setBy(e.target.value as typeof by)} options={[{ value: "method", label: "By method" }, { value: "type", label: "By order type" }, { value: "source", label: "By source" }, { value: "staff", label: "By receiver" }]} />
          }
        >
          {!breakdown.data ? (
            <Loading />
          ) : (
            <BarList format={money} rows={breakdown.data.map((r) => ({ key: r.key, value: r.amount, note: `${r.count}×` }))} />
          )}
        </Card>
      </div>

      <Card title="Transactions" className="mt-4">
        {!transactions.data ? (
          <Loading />
        ) : (
          <>
            <Table columns={TRANSACTION_COLUMNS} rows={transactions.data.items} rowKey={(t) => t._id} empty="No payments in this period." />
            <Pagination meta={transactions.data.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <Card title="Dues to collect" className="mt-4">
        {!dues.data ? (
          <Loading />
        ) : (
          <>
            <Table columns={DUE_COLUMNS} rows={dues.data.items} rowKey={(o) => o._id} empty="Nothing is due." />
            <Pagination meta={dues.data.meta} onPage={setDuePage} />
          </>
        )}
      </Card>
    </>
  );
}
