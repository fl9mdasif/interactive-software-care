"use client";

import { useGetLeadQuery } from "@/redux/api/leadApi";
import { useGetMeetingQuery } from "@/redux/api/meetingApi";
import { useGetOrderQuery } from "@/redux/api/orderApi";
import { ErrorState, LinkButton, Loading, PageHeader, EmptyState } from "../ui";
import { OrderForm } from "./OrderForm";

function FromMeeting({ id }: { id: string }) {
  const { data: meeting, error, refetch } = useGetMeetingQuery(id);
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!meeting) return <Loading />;
  if (meeting.order)
    return (
      <EmptyState message={`This meeting already has order ${meeting.order.orderNo}.`}>
        <LinkButton href={`/dashboard/orders/${meeting.order._id}`} variant="secondary">
          Open order
        </LinkButton>
      </EmptyState>
    );
  return <OrderForm key={meeting._id} meeting={meeting} />;
}

export function NewOrder({ leadId, meetingId }: { leadId?: string; meetingId?: string }) {
  const { data: lead, error, refetch } = useGetLeadQuery(leadId!, { skip: !leadId });

  let body;
  if (meetingId) body = <FromMeeting id={meetingId} />;
  else if (!leadId) body = <OrderForm />;
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
      <PageHeader title="New order" description={leadId || meetingId ? "Check the copied details, then add the price." : undefined} />
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
