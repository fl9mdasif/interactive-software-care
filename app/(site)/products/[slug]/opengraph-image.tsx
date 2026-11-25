import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { getProduct } from "@/lib/api";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Product";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return renderOgImage({
    eyebrow: "Product",
    title: product?.name ?? "Product",
    description: product?.tagline,
  });
}
