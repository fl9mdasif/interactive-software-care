"use client";

import Link from "next/link";
import { AlarmClock, Hourglass, Inbox, Plus, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { formatDate, money, toDay } from "@/lib/format";
import { useGetOverviewQuery } from "@/redux/api/orderApi";
import { useGetSalesSeriesQuery, useGetSalesSummaryQuery } from "@/redux/api/salesApi";
import type { TOrderCard } from "@/types";
import { BarList, SalesChart } from "./charts/Charts";
import { change } from "./SalesPage";
import { Badge, Card, EmptyState, ErrorState, LinkButton, Loading, PageHeader, StatCard } from "./ui";
import { useRole } from "./useRole";

function Revenue() {
  // The last twelve calendar months, including this one.
  const today = toDay();
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 12, 1)).toISOString().slice(0, 10);
  const summary = useGetSalesSummaryQuery({});
  const series = useGetSalesSeriesQuery({ from: start, to: today, period: "month" });
  const s = summary.data;

  if (summary.error) return <ErrorState error={summary.error} retry={summary.refetch} />;
  return (
    <>
      {s && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatCard href="/dashboard/sales" title="Received this month" value={money(s.month.amount)} note={change(s.month.amount, s.previousMonth.amount)} icon={TrendingUp} />
          <StatCard href="/dashboard/sales" title="Received this year" value={money(s.period.amount)} note={`Today ${money(s.today.amount)}`} icon={Wallet} />
          <StatCard href="/dashboard/sales" title="Outstanding due" value={money(s.due.amount)} note={`${s.due.count} orders`} icon={Hourglass} />
        </div>
      )}
      <Card title="Received per month (last 12 months)" className="mb-4">
        {series.data ? <SalesChart data={series.data} /> : <Loading />}
      </Card>
    </>
  );
}

function OrderList({ orders, empty }: { orders: TOrderCard[]; empty: string }) {
  if (!orders.length) return <EmptyState message={empty} />;
  return (
    <ul>
      {orders.map((o) => (
        <li key={o._id} className="border-b border-line last:border-0">
          <Link href={`/dashboard/orders/${o._id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-acid">
            <span className="min-w-0">
              <span className="block truncate font-medium">{o.title}</span>
              <span className="block truncate text-xs text-text-dim">
                {o.orderNo} · {o.customer.name}
                {o.deadline && ` · due ${formatDate(o.deadline)}`}
              </span>
            </span>
            <Badge value={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OverviewPage() {
  const { me, isAdmin } = useRole();
  const { data, error, refetch } = useGetOverviewQuery();

  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return <Loading />;

  const count = (...statuses: string[]) => data.byStatus.filter((s) => statuses.includes(s.status)).reduce((n, s) => n + s.count, 0);

  return (
    <>
      <PageHeader title={`Welcome, ${me?.username ?? ""}`} description="What needs attention today.">
        <LinkButton href="/dashboard/orders/new">
          <Plus className="size-4" /> New order
        </LinkButton>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard href="/dashboard/orders" title="Active orders" value={count("confirmed", "in_progress", "review")} note={`${count("pending")} pending · ${count("on_hold")} on hold`} icon={ShoppingCart} />
        <StatCard href="/dashboard/orders" title="Late orders" value={data.overdue.length >= 8 ? "8+" : data.overdue.length} note="Past deadline, not delivered" icon={AlarmClock} />
        <StatCard href="/dashboard/leads" title="New leads" value={data.newLeads} note="Waiting for a reply" icon={Inbox} />
      </div>

      {isAdmin && <Revenue />}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Late">
          <OrderList orders={data.overdue} empty="Nothing is late." />
        </Card>
        <Card title="Upcoming deadlines">
          <OrderList orders={data.upcoming} empty="No upcoming deadlines." />
        </Card>
        <Card title="Orders by status">
          <BarList format={String} empty="No orders yet." rows={data.byStatus.map((s) => ({ key: s.status, value: s.count }))} />
        </Card>
        <Card title="Latest orders">
          <OrderList orders={data.recent} empty="No orders yet." />
        </Card>
        <Card title="New leads" className="xl:col-span-2">
          {data.recentLeads.length ? (
            <ul>
              {data.recentLeads.map((l) => (
                <li key={l._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2.5 text-sm last:border-0">
                  <span>
                    <span className="font-medium">{l.name}</span>
                    <span className="ml-2 text-xs text-text-dim">
                      {l.email} · {formatDate(l.createdAt)}
                    </span>
                  </span>
                  <LinkButton href={`/dashboard/orders/new?lead=${l._id}`} variant="secondary" size="sm">
                    Convert to order
                  </LinkButton>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No new leads." />
          )}
        </Card>
      </div>
    </>
  );
}
