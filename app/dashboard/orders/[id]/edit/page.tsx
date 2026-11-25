import { EditOrder } from "@/components/dashboard/orders/OrderPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditOrder id={id} />;
}
