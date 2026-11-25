"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Mail, MessageCircle, Pencil, Phone, Plus } from "lucide-react";
import { ORDER_FLOW } from "@/lib/constants";
import { formatDate, formatDateTime, label, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useAddOrderNoteMutation,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useVoidPaymentMutation,
} from "@/redux/api/orderApi";
import type { TOrder, TOrderStatus, TPayment } from "@/types";
import { run } from "../toast";
import { Badge, Button, Card, Column, ErrorState, Input, LinkButton, Loading, PageHeader, Table } from "../ui";
import { useRole } from "../useRole";
import { isOverdue } from "./OrdersPage";
import { PaymentModal } from "./PaymentModal";
import { ReasonModal } from "./ReasonModal";

/** wa.me needs the country code and digits only; local numbers are Bangladeshi. */
const whatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${/^01\d{9}$/.test(digits) ? `88${digits}` : digits}`;
};

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-sm last:border-0">
      <dt className="text-text-dim">{title}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function StatusBar({ order }: { order: TOrder }) {
  const { isAdmin } = useRole();
  const [update, { isLoading }] = useUpdateOrderStatusMutation();
  const [cancelling, setCancelling] = useState(false);
  const cancelled = order.status === "cancelled";
  const reached = ORDER_FLOW.indexOf(order.status);
  const set = (status: TOrderStatus, reason?: string) =>
    run(update({ id: order._id, status, reason }), `Status: ${label(status)}`);

  return (
    <Card className="mb-4">
      {cancelled ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <Badge value="cancelled" /> <span className="ml-2 text-text-mid">{order.cancelReason}</span>
          </p>
          {isAdmin && (
            <Button variant="secondary" size="sm" busy={isLoading} onClick={() => set("pending")}>
              Reopen order
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ol className="flex flex-1 flex-wrap gap-2" aria-label="Order progress">
            {ORDER_FLOW.map((status, i) => (
              <li key={status}>
                <button
                  type="button"
                  disabled={isLoading || status === order.status}
                  aria-current={status === order.status ? "step" : undefined}
                  onClick={() => set(status)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs disabled:cursor-default",
                    status === order.status
                      ? "border-acid bg-acid text-on-accent font-semibold"
                      : i < reached
                        ? "border-acid/50 bg-acid-dim"
                        : "border-line-strong text-text-dim hover:border-acid",
                  )}
                >
                  {i < reached && <Check className="size-3" />}
                  {label(status)}
                </button>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button
              variant={order.status === "on_hold" ? "primary" : "secondary"}
              size="sm"
              disabled={isLoading || order.status === "on_hold"}
              onClick={() => set("on_hold")}
            >
              {order.status === "on_hold" ? "On hold" : "Put on hold"}
            </Button>
            {isAdmin && (
              <Button variant="danger" size="sm" onClick={() => setCancelling(true)}>
                Cancel order
              </Button>
            )}
          </div>
        </div>
      )}
      {cancelling && (
        <ReasonModal
          title={`Cancel ${order.orderNo}`}
          message={
            order.paidAmount > 0
              ? `${money(order.paidAmount, order.currency)} has been received and stays counted in sales. If you refunded it, void the payment.`
              : "The order is kept in history and removed from dues."
          }
          action="Cancel order"
          busy={isLoading}
          onClose={() => setCancelling(false)}
          onSubmit={async (reason) => {
            if (await set("cancelled", reason)) setCancelling(false);
          }}
        />
      )}
    </Card>
  );
}

function Payments({ order }: { order: TOrder }) {
  const { isAdmin } = useRole();
  const [adding, setAdding] = useState(false);
  const [voiding, setVoiding] = useState<TPayment | null>(null);
  const [voidPayment, { isLoading }] = useVoidPaymentMutation();
  const percent = order.total ? Math.min(100, (order.paidAmount / order.total) * 100) : 0;
  const struck = (p: TPayment) => cn(p.voided && "text-text-dim line-through");

  const columns: Column<TPayment>[] = [
    { header: "Date", cell: (p) => <span className={cn("whitespace-nowrap", struck(p))}>{formatDate(p.paidAt)}</span> },
    {
      header: "Amount",
      cell: (p) => (
        <span className={cn("whitespace-nowrap font-medium", struck(p))}>
          {money(p.amount, order.currency)}
          {order.currency === "USD" && <span className="block text-xs font-normal text-text-dim">{money(p.amountBdt)} @ {p.exchangeRate}</span>}
        </span>
      ),
    },
    {
      header: "Method",
      cell: (p) => (
        <span className={struck(p)}>
          {label(p.method)}
          {p.trxId && <span className="block font-mono text-xs text-text-dim">{p.trxId}</span>}
        </span>
      ),
    },
    {
      header: "Note",
      cell: (p) => (
        <span className="block min-w-32 text-xs text-text-mid">
          {p.voided ? `Voided by ${p.voidedBy?.username ?? "—"}: ${p.voidReason}` : p.note || "—"}
        </span>
      ),
    },
    { header: "Received by", cell: (p) => p.receivedBy?.username ?? "—" },
    {
      header: "",
      cell: (p) =>
        p.voided ? (
          <Badge value="voided" />
        ) : (
          isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setVoiding(p)}>
              Void
            </Button>
          )
        ),
      className: "text-right",
    },
  ];

  return (
    <Card
      title="Payments"
      action={
        order.status !== "cancelled" &&
        order.dueAmount > 0 && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add payment
          </Button>
        )
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        {[
          ["Total", order.total],
          ["Received", order.paidAmount],
          ["Due", order.status === "cancelled" ? 0 : order.dueAmount],
        ].map(([title, value]) => (
          <div key={title as string}>
            <div className="text-xs text-text-dim">{title}</div>
            <div className="font-display text-lg font-semibold">{money(value as number, order.currency)}</div>
          </div>
        ))}
      </div>
      <div
        role="progressbar"
        aria-label="Amount received"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-acid" style={{ width: `${percent}%` }} />
      </div>
      <Table columns={columns} rows={order.payments} rowKey={(p) => p._id} empty="No payment received yet." />
      {adding && <PaymentModal order={order} onClose={() => setAdding(false)} />}
      {voiding && (
        <ReasonModal
          title="Void payment"
          message={`${money(voiding.amount, order.currency)} will be removed from the received amount and from sales. The record stays visible.`}
          action="Void payment"
          busy={isLoading}
          onClose={() => setVoiding(null)}
          onSubmit={async (reason) => {
            if (await run(voidPayment({ id: order._id, paymentId: voiding._id, reason }), "Payment voided")) setVoiding(null);
          }}
        />
      )}
    </Card>
  );
}

function History({ order }: { order: TOrder }) {
  const [note, setNote] = useState("");
  const [addNote, { isLoading }] = useAddOrderNoteMutation();

  return (
    <Card title="History">
      <form
        className="mb-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(addNote({ id: order._id, message: note }), "Note added")) setNote("");
        }}
      >
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (call, feedback, next step)" aria-label="New note" required maxLength={2000} />
        <Button type="submit" variant="secondary" busy={isLoading}>
          Add
        </Button>
      </form>
      <ol className="flex flex-col gap-3">
        {[...order.timeline].reverse().map((t, i) => (
          <li key={i} className="border-l-2 border-line-strong pl-3 text-sm">
            <p className={cn("whitespace-pre-wrap break-words", t.type === "note" && "font-medium")}>{t.message}</p>
            <p className="text-xs text-text-dim">
              {t.by?.username ?? "—"} · {formatDateTime(t.at)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { data: order, error, refetch } = useGetOrderQuery(id);

  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!order) return <Loading />;
  const { customer } = order;

  return (
    <>
      <PageHeader title={order.title} description={`${order.orderNo} · created ${formatDate(order.createdAt)} by ${order.createdBy?.username ?? "—"}`}>
        <LinkButton href="/dashboard/orders" variant="ghost">
          All orders
        </LinkButton>
        <LinkButton href={`/dashboard/orders/${order._id}/edit`} variant="secondary">
          <Pencil className="size-4" /> Edit
        </LinkButton>
      </PageHeader>

      <StatusBar order={order} />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Payments order={order} />
          <History order={order} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Customer">
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-text-dim">{[customer.company, customer.country].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {customer.phone && (
                <>
                  <a className="flex items-center gap-2 hover:text-acid" href={`tel:${customer.phone}`}>
                    <Phone className="size-4" /> {customer.phone}
                  </a>
                  <a className="flex items-center gap-2 hover:text-acid" href={whatsapp(customer.phone)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" /> Message on WhatsApp
                  </a>
                </>
              )}
              {customer.email && (
                <a className="flex items-center gap-2 break-all hover:text-acid" href={`mailto:${customer.email}`}>
                  <Mail className="size-4" /> {customer.email}
                </a>
              )}
            </div>
          </Card>

          <Card title="Details">
            <dl>
              <Fact title="Type">{label(order.type)}</Fact>
              <Fact title="Source">{label(order.source)}</Fact>
              {order.service && <Fact title="Service">{order.service.title}</Fact>}
              {order.product && <Fact title="Product">{order.product.name}</Fact>}
              <Fact title="Priority">
                <Badge value={order.priority} />
              </Fact>
              <Fact title="Deadline">
                <span className={cn(isOverdue(order) && "text-danger")}>
                  {formatDate(order.deadline)}
                  {isOverdue(order) && " (late)"}
                </span>
              </Fact>
              {order.deliveredAt && <Fact title="Delivered">{formatDate(order.deliveredAt)}</Fact>}
              <Fact title="Assigned to">{order.assignedTo?.username ?? "Nobody yet"}</Fact>
              {order.discount > 0 && <Fact title="Discount">{money(order.discount, order.currency)}</Fact>}
              {order.currency === "USD" && <Fact title="Order rate">1 USD = {order.exchangeRate} BDT</Fact>}
              {order.lead && (
                <Fact title="From lead">
                  <Link className="text-acid" href="/dashboard/leads">
                    {order.lead.name}
                  </Link>
                </Fact>
              )}
            </dl>
            {order.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-text-mid">{order.description}</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
