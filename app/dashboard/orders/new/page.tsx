import { NewOrder } from "@/components/dashboard/orders/OrderPages";

export default async function Page({ searchParams }: { searchParams: Promise<{ lead?: string; meeting?: string }> }) {
  const { lead, meeting } = await searchParams;
  return <NewOrder leadId={lead} meetingId={meeting} />;
}
