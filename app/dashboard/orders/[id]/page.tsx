import { OrderDetail } from "@/components/dashboard/orders/OrderDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
