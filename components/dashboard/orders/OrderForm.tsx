"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_PRIORITIES, ORDER_SOURCES, ORDER_TYPES } from "@/lib/constants";
import { money, toDay } from "@/lib/format";
import { useGetAdminProductsQuery, useGetServiceOptionsQuery } from "@/redux/api/contentApi";
import { useCreateOrderMutation, useGetAssigneesQuery, useUpdateOrderMutation } from "@/redux/api/orderApi";
import type { TLead, TOrder, TOrderInput } from "@/types";
import { run } from "../toast";
import { Button, Card, Field, Input, Select, Textarea } from "../ui";
import { useRole } from "../useRole";

const initial = (order?: TOrder, lead?: TLead) => ({
  name: order?.customer.name ?? lead?.name ?? "",
  phone: order?.customer.phone ?? lead?.phone ?? "",
  email: order?.customer.email ?? lead?.email ?? "",
  company: order?.customer.company ?? "",
  country: order?.customer.country ?? "",
  title: order?.title ?? (lead?.serviceInterested ? `${lead.serviceInterested.title} for ${lead.name}` : ""),
  description: order?.description ?? lead?.message ?? "",
  type: order?.type ?? "project",
  source: order?.source ?? (lead ? "website" : "direct"),
  service: order?.service?._id ?? lead?.serviceInterested?._id ?? "",
  product: order?.product?._id ?? "",
  priority: order?.priority ?? "normal",
  deadline: order?.deadline ? toDay(order.deadline) : "",
  assignedTo: order?.assignedTo?._id ?? "",
  status: "pending",
  currency: order?.currency ?? "BDT",
  exchangeRate: order && order.currency === "USD" ? String(order.exchangeRate) : "",
  amount: order ? String(order.amount) : "",
  discount: order?.discount ? String(order.discount) : "",
});

export function OrderForm({ order, lead }: { order?: TOrder; lead?: TLead }) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [form, setForm] = useState(() => initial(order, lead));
  const { data: services = [] } = useGetServiceOptionsQuery();
  const { data: products = [] } = useGetAdminProductsQuery(undefined, { skip: !isAdmin });
  const { data: team = [] } = useGetAssigneesQuery();
  const [create, creating] = useCreateOrderMutation();
  const [update, updating] = useUpdateOrderMutation();

  const priceLocked = !!order && !isAdmin;
  const currencyLocked = !!order && order.paidAmount > 0;
  const total = Math.max(0, Number(form.amount || 0) - Number(form.discount || 0));
  const usd = form.currency === "USD";

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: TOrderInput = {
      customer: { name: form.name, phone: form.phone, email: form.email, company: form.company, country: form.country },
      title: form.title,
      description: form.description,
      type: form.type as TOrderInput["type"],
      source: form.source as TOrderInput["source"],
      service: form.service,
      product: form.product,
      priority: form.priority as TOrderInput["priority"],
      deadline: form.deadline,
      assignedTo: form.assignedTo,
    };
    if (!priceLocked) {
      data.currency = form.currency as TOrderInput["currency"];
      data.amount = Number(form.amount);
      data.discount = Number(form.discount || 0);
      if (usd) data.exchangeRate = Number(form.exchangeRate);
    }
    if (!order) {
      data.status = form.status as TOrderInput["status"];
      if (lead) data.lead = lead._id;
    }

    const saved = order
      ? await run(update({ id: order._id, data }), "Order updated")
      : await run(create(data), "Order created");
    if (saved) router.push(`/dashboard/orders/${order?._id ?? saved._id}`);
  };

  // A product already linked stays selectable even for staff, who cannot list products.
  const productOptions = products.length
    ? products.map((p) => ({ value: p._id, label: p.name }))
    : order?.product
      ? [{ value: order.product._id, label: order.product.name }]
      : [];

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-2">
      <Card title="Customer">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *" className="sm:col-span-2">
            <Input {...bind("name")} required maxLength={120} />
          </Field>
          <Field label="Phone / WhatsApp">
            <Input {...bind("phone")} inputMode="tel" maxLength={40} />
          </Field>
          <Field label="Email">
            <Input {...bind("email")} type="email" />
          </Field>
          <Field label="Company">
            <Input {...bind("company")} maxLength={120} />
          </Field>
          <Field label="Country">
            <Input {...bind("country")} maxLength={60} />
          </Field>
        </div>
      </Card>

      <Card title="Price">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Currency" hint={currencyLocked ? "Locked after the first payment" : undefined}>
            <Select {...bind("currency")} disabled={priceLocked || currencyLocked} options={[{ value: "BDT", label: "BDT (৳)" }, { value: "USD", label: "USD ($)" }]} />
          </Field>
          {usd && (
            <Field label="1 USD = ? BDT *">
              <Input {...bind("exchangeRate")} disabled={priceLocked} type="number" min="1.01" step="0.01" required={!priceLocked} />
            </Field>
          )}
          <Field label="Amount *">
            <Input {...bind("amount")} disabled={priceLocked} type="number" min="0" step="0.01" required />
          </Field>
          <Field label="Discount">
            <Input {...bind("discount")} disabled={priceLocked} type="number" min="0" step="0.01" max={form.amount || undefined} />
          </Field>
        </div>
        <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
          <span className="text-text-dim">Total</span>
          <b className="text-lg">{money(total, usd ? "USD" : "BDT")}</b>
        </p>
        {priceLocked && <p className="mt-2 text-xs text-text-dim">Only an admin can change the price.</p>}
      </Card>

      <Card title="Work" className="xl:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Title *" className="sm:col-span-2 lg:col-span-3">
            <Input {...bind("title")} required maxLength={200} />
          </Field>
          <Field label="Details" className="sm:col-span-2 lg:col-span-3">
            <Textarea {...bind("description")} maxLength={5000} />
          </Field>
          <Field label="Type">
            <Select {...bind("type")} options={ORDER_TYPES} />
          </Field>
          <Field label="Source">
            <Select {...bind("source")} options={ORDER_SOURCES} />
          </Field>
          <Field label="Service">
            <Select {...bind("service")} placeholder="None" options={services.map((s) => ({ value: s._id, label: s.title }))} />
          </Field>
          {productOptions.length > 0 && (
            <Field label="ISC product">
              <Select {...bind("product")} placeholder="None" options={productOptions} />
            </Field>
          )}
          <Field label="Priority">
            <Select {...bind("priority")} options={ORDER_PRIORITIES} />
          </Field>
          <Field label="Deadline">
            <Input {...bind("deadline")} type="date" />
          </Field>
          <Field label="Assigned to">
            <Select {...bind("assignedTo")} placeholder="Nobody yet" options={team.map((u) => ({ value: u._id, label: u.username }))} />
          </Field>
          {!order && (
            <Field label="Starting status">
              <Select {...bind("status")} options={["pending", "confirmed", "in_progress"]} />
            </Field>
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-2 xl:col-span-2">
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" busy={creating.isLoading || updating.isLoading}>
          {order ? "Save changes" : "Create order"}
        </Button>
      </div>
    </form>
  );
}
