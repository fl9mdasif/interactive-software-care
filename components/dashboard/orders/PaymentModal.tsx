"use client";

import { useState } from "react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { money, toDay } from "@/lib/format";
import { useAddPaymentMutation } from "@/redux/api/orderApi";
import type { TOrder, TPaymentMethod } from "@/types";
import { run } from "../toast";
import { Button, Field, Input, Modal, Select } from "../ui";

export function PaymentModal({ order, onClose }: { order: TOrder; onClose: () => void }) {
  const [add, { isLoading }] = useAddPaymentMutation();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("bkash");
  const [rate, setRate] = useState(String(order.exchangeRate));
  const [paidAt, setPaidAt] = useState(toDay());
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const usd = order.currency === "USD";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await run(
      add({
        id: order._id,
        data: {
          amount: Number(amount),
          method: method as TPaymentMethod,
          paidAt,
          trxId,
          note,
          ...(usd ? { exchangeRate: Number(rate) } : {}),
        },
      }),
      "Payment recorded",
    );
    if (saved) onClose();
  };

  return (
    <Modal title={`Add payment · ${order.orderNo}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label={`Amount (${order.currency}) *`} hint={`Due: ${money(order.dueAmount, order.currency)}`}>
          <Input type="number" min="0.01" step="0.01" max={order.dueAmount} value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
        </Field>
        <Field label="Method *">
          <Select options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        </Field>
        {usd && (
          <Field label="1 USD = ? BDT *" hint={amount ? `Counts as ${money(Number(amount) * Number(rate))} in sales` : undefined}>
            <Input type="number" min="1.01" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required />
          </Field>
        )}
        <Field label="Payment date *">
          <Input type="date" max={toDay()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required />
        </Field>
        <Field label="Transaction ID">
          <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} maxLength={100} />
        </Field>
        <Field label="Note" className="sm:col-span-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
          <Button variant="ghost" size="sm" onClick={() => setAmount(String(order.dueAmount))}>
            Fill full due
          </Button>
          <Button type="submit" busy={isLoading}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
