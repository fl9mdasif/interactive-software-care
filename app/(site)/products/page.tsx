import type { Metadata } from "next";
import Link from "next/link";
import { Motion } from "@/components/motion/Motion";
import { CTA } from "@/components/sections/CTA";
import { PageHero } from "@/components/sections/PageHero";
import { ProductBrowser } from "@/components/sections/ProductBrowser";
import { getProducts, getSettings } from "@/lib/api";
import { pageOg } from "@/lib/site";

export const metadata: Metadata = {
  title: "Products",
  description: "SaaS and AI products built and run by Interactive Software Care.",
  alternates: { canonical: "/products" },
  openGraph: pageOg("/products"),
};

export default async function ProductsPage() {
  const [items, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <>
      <PageHero
        eyebrow="Our products"
        title={
          <>
            SaaS and AI, <span className="grad">built by us</span>
          </>
        }
        lead="Software we design, run and support under our own name."
        crumbs={[{ href: "/", label: "Home" }, { label: "Products" }]}
      />
      <section className="section flush-top">
        <div className="wrap">
          {items.length ? (
            <ProductBrowser items={items} />
          ) : (
            <p className="empty">
              New products are on the way. <Link href="/contact">Tell us what you need</Link>.
            </p>
          )}
        </div>
      </section>
      <CTA settings={settings} />
      <Motion />
    </>
  );
}
