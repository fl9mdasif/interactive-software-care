import { NewOrder } from "@/components/dashboard/orders/OrderPages";

export default async function Page({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams;
  return <NewOrder leadId={lead} />;
}
