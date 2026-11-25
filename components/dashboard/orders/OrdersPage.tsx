"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, LayoutGrid, List, Pencil, Plus } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatDate, money, toDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetOrdersQuery } from "@/redux/api/orderApi";
import type { TOrder } from "@/types";
import { Badge, Button, Card, Column, ErrorState, LinkButton, Loading, PageHeader, Pagination, SearchInput, Select, Table } from "../ui";
import { OrderBoard } from "./OrderBoard";

export const isOverdue = (order: Pick<TOrder, "deadline" | "status">) =>
  !!order.deadline &&
  !["delivered", "completed", "cancelled"].includes(order.status) &&
  toDay(order.deadline) < toDay();

const COLUMNS: Column<TOrder>[] = [
  {
    header: "Order",
    cell: (o) => (
      <Link href={`/dashboard/orders/${o._id}`} className="block min-w-52 hover:text-acid">
        <span className="font-medium">{o.title}</span>
        <span className="block font-mono text-xs text-text-dim">{o.orderNo}</span>
      </Link>
    ),
  },
  {
    header: "Customer",
    cell: (o) => (
      <div className="min-w-32">
        {o.customer.name}
        <span className="block text-xs text-text-dim">{o.customer.company || o.customer.phone}</span>
      </div>
    ),
  },
  { header: "Status", cell: (o) => <Badge value={o.status} /> },
  { header: "Payment", cell: (o) => <Badge value={o.paymentStatus} /> },
  { header: "Total", cell: (o) => money(o.total, o.currency), className: "text-right whitespace-nowrap" },
  {
    header: "Due",
    cell: (o) => (o.status === "cancelled" ? "—" : money(o.dueAmount, o.currency)),
    className: "text-right whitespace-nowrap",
  },
  {
    header: "Deadline",
    cell: (o) => (
      <span className={cn("whitespace-nowrap", isOverdue(o) && "font-medium text-danger")}>
        {formatDate(o.deadline)}
        {isOverdue(o) && " (late)"}
      </span>
    ),
  },
  { header: "Assigned", cell: (o) => o.assignedTo?.username ?? "—" },
  {
    header: "Actions",
    className: "text-right",
    cell: (o) => (
      <div className="flex justify-end gap-1">
        <LinkButton href={`/dashboard/orders/${o._id}`} variant="ghost" size="sm" aria-label={`View ${o.orderNo}`}>
          <Eye className="size-3.5" /> View
        </LinkButton>
        <LinkButton href={`/dashboard/orders/${o._id}/edit`} variant="secondary" size="sm" aria-label={`Edit ${o.orderNo}`}>
          <Pencil className="size-3.5" /> Edit
        </LinkButton>
      </div>
    ),
  },
];

export function OrdersPage() {
  const [view, setView] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", paymentStatus: "", type: "" });
  const [page, setPage] = useState(1);
  const term = useDebouncedValue(search, 350);

  const board = view === "board";
  const params = Object.fromEntries(
    Object.entries({
      ...filters,
      status: board ? "" : filters.status,
      search: term,
      page: board ? 1 : page,
      limit: board ? 200 : 20,
    }).filter(([, v]) => v !== ""),
  );
  const { data, error, refetch, isFetching } = useGetOrdersQuery(params);

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Orders" description="Every order from first contact to delivery and payment.">
        <div className="flex gap-1" role="group" aria-label="View">
          <Button variant={board ? "ghost" : "secondary"} size="sm" aria-pressed={!board} onClick={() => setView("list")}>
            <List className="size-4" /> List
          </Button>
          <Button variant={board ? "secondary" : "ghost"} size="sm" aria-pressed={board} onClick={() => setView("board")}>
            <LayoutGrid className="size-4" /> Board
          </Button>
        </div>
        <LinkButton href="/dashboard/orders/new">
          <Plus className="size-4" /> New order
        </LinkButton>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search order no, title, customer, phone"
        />
        {!board && (
          <Select className="w-40" aria-label="Status" placeholder="All statuses" options={ORDER_STATUSES} value={filters.status} onChange={(e) => setFilter("status", e.target.value)} />
        )}
        <Select className="w-40" aria-label="Payment" placeholder="All payments" options={PAYMENT_STATUSES} value={filters.paymentStatus} onChange={(e) => setFilter("paymentStatus", e.target.value)} />
        <Select className="w-40" aria-label="Type" placeholder="All types" options={ORDER_TYPES} value={filters.type} onChange={(e) => setFilter("type", e.target.value)} />
      </div>

      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !data ? (
        <Loading />
      ) : board ? (
        <>
          {data.meta.total > data.items.length && (
            <p className="mb-3 text-xs text-text-dim">
              Showing the newest {data.items.length} of {data.meta.total} orders. Use search or filters to narrow down.
            </p>
          )}
          <OrderBoard orders={data.items} />
        </>
      ) : (
        <Card className={cn(isFetching && "opacity-70")}>
          <Table columns={COLUMNS} rows={data.items} rowKey={(o) => o._id} empty="No orders match." />
          <Pagination meta={data.meta} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
