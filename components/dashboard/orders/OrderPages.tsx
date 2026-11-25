"use client";

import { useGetLeadQuery } from "@/redux/api/leadApi";
import { useGetOrderQuery } from "@/redux/api/orderApi";
import { ErrorState, LinkButton, Loading, PageHeader, EmptyState } from "../ui";
import { OrderForm } from "./OrderForm";

export function NewOrder({ leadId }: { leadId?: string }) {
  const { data: lead, error, refetch } = useGetLeadQuery(leadId!, { skip: !leadId });

  let body;
  if (!leadId) body = <OrderForm />;
  else if (error) body = <ErrorState error={error} retry={refetch} />;
  else if (!lead) body = <Loading />;
  else if (lead.order)
    body = (
      <EmptyState message={`This lead already has order ${lead.order.orderNo}.`}>
        <LinkButton href={`/dashboard/orders/${lead.order._id}`} variant="secondary">
          Open order
        </LinkButton>
      </EmptyState>
    );
  else body = <OrderForm key={lead._id} lead={lead} />;

  return (
    <>
      <PageHeader title="New order" description={leadId ? "Check the details copied from the lead, then add the price." : undefined} />
      {body}
    </>
  );
}

export function EditOrder({ id }: { id: string }) {
  const { data: order, error, refetch } = useGetOrderQuery(id);
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!order) return <Loading />;
  return (
    <>
      <PageHeader title={`Edit ${order.orderNo}`} />
      <OrderForm key={order._id} order={order} />
    </>
  );
}
