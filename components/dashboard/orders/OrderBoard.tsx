"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDate, label, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUpdateOrderStatusMutation } from "@/redux/api/orderApi";
import type { TOrder, TOrderStatus } from "@/types";
import { run } from "../toast";
import { Badge, LinkButton, Select } from "../ui";
import { useRole } from "../useRole";
import { isOverdue } from "./OrdersPage";

/** Pipeline view: drag a card to another column, or use its status menu. */
export function OrderBoard({ orders }: { orders: TOrder[] }) {
  const { isAdmin } = useRole();
  const [update] = useUpdateOrderStatusMutation();
  const [over, setOver] = useState<TOrderStatus | null>(null);

  // Cancelling needs a reason, so it is done from the order page.
  const columns = ORDER_STATUSES.filter((s) => s !== "cancelled");
  const move = (id: string, status: TOrderStatus) => {
    const order = orders.find((o) => o._id === id);
    if (order && order.status !== status) run(update({ id, status }), `Moved to ${label(status)}`);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {columns.map((status) => {
        const items = orders.filter((o) => o.status === status);
        return (
          <section
            key={status}
            aria-label={label(status)}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              move(e.dataTransfer.getData("text/plain"), status);
            }}
            className={cn("flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-surface p-2", over === status ? "border-acid" : "border-line")}
          >
            <h2 className="flex items-center justify-between px-1 py-1 text-sm">
              {label(status)}
              <span className="text-xs text-text-dim">{items.length}</span>
            </h2>
            {items.map((o) => (
              <article
                key={o._id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", o._id)}
                className="cursor-grab rounded-lg border border-line bg-surface-2 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/dashboard/orders/${o._id}`} className="min-w-0 break-words font-medium hover:text-acid">
                    {o.title}
                  </Link>
                  <LinkButton href={`/dashboard/orders/${o._id}/edit`} variant="ghost" size="sm" aria-label={`Edit ${o.orderNo}`}>
                    <Pencil className="size-3.5" />
                  </LinkButton>
                </div>
                <p className="text-xs text-text-dim">
                  {o.orderNo} · {o.customer.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge value={o.paymentStatus} />
                  {(o.priority === "high" || o.priority === "urgent") && <Badge value={o.priority} />}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span>{money(o.total, o.currency)}</span>
                  {o.deadline && <span className={cn(isOverdue(o) ? "text-danger" : "text-text-dim")}>{formatDate(o.deadline)}</span>}
                </div>
                <Select
                  className="mt-2 h-8 text-xs"
                  aria-label={`Status of ${o.orderNo}`}
                  options={isAdmin ? ORDER_STATUSES.filter((s) => s !== "cancelled") : columns}
                  value={o.status}
                  onChange={(e) => move(o._id, e.target.value as TOrderStatus)}
                />
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
