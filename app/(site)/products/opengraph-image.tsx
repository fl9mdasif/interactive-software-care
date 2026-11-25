import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Our products";

export default function Image() {
  return renderOgImage({ eyebrow: "Our products", title: "SaaS and AI, built by us", description: "Software we design, run and support under our own name." });
}
