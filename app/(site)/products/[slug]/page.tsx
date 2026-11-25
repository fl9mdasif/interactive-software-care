import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Motion } from "@/components/motion/Motion";
import { CTA } from "@/components/sections/CTA";
import { PageHero } from "@/components/sections/PageHero";
import { CldImg } from "@/components/ui/CldImg";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichText } from "@/components/ui/RichText";
import { getProduct, getProducts, getSettings } from "@/lib/api";
import { cld } from "@/lib/cloudinary";
import { label, money } from "@/lib/format";
import { breadcrumbSchema, productSchema } from "@/lib/schema";
import { pageOg } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const items = await getProducts();
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const image = product.thumbnail ? cld(product.thumbnail, { w: 1200, h: 630 }) : undefined;
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.tagline,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: pageOg(`/products/${product.slug}`, image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
  };
}

const PERIOD = { month: "/ month", year: "/ year", once: "one-time" };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const settings = await getSettings();
  const soon = product.status === "coming_soon";
  const discontinued = product.status === "discontinued";

  return (
    <>
      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
      <PageHero
        eyebrow={soon || discontinued ? label(product.status) : `${label(product.type)} product`}
        title={product.name}
        lead={product.tagline}
        crumbs={[{ href: "/", label: "Home" }, { href: "/products", label: "Products" }, { label: product.name }]}
      />

      <section className="section flush-top">
        <div className="wrap">
          {product.thumbnail && (
            <div className="case-cover reveal">
              <CldImg src={product.thumbnail} alt={`${product.name} preview`} w={1600} h={900} sizes="(max-width: 1240px) 100vw, 1192px" priority />
            </div>
          )}

          <div className="detail-grid">
            <div>
              <RichText value={product.description} className="reveal" />

              {product.features.length > 0 && (
                <>
                  <h2 className="sub-h reveal">What it does</h2>
                  <ul className="feature-list reveal">
                    {product.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}

              {product.gallery.length > 0 && (
                <div className="gallery" data-stagger>
                  {product.gallery.map((src, i) => (
                    <figure key={src} style={{ position: "relative" }}>
                      <CldImg src={src} alt={`${product.name} screen ${i + 1}`} w={900} h={560} sizes="(max-width: 620px) 100vw, 50vw" />
                    </figure>
                  ))}
                </div>
              )}

              {!discontinued && product.pricingPlans.length > 0 && (
                <>
                  <h2 className="sub-h reveal">Pricing</h2>
                  <div className="price-grid" data-stagger>
                    {product.pricingPlans.map((plan) => (
                      <article key={plan.name} className="price-card">
                        <h3>{plan.name}</h3>
                        <p className="price">
                          {money(plan.price, plan.currency)} <small>{PERIOD[plan.period]}</small>
                        </p>
                        {plan.features.length > 0 && (
                          <ul className="feature-list">
                            {plan.features.map((f) => (
                              <li key={f}>{f}</li>
                            ))}
                          </ul>
                        )}
                        <Link href="/contact" className="btn btn-ghost btn-sm">
                          {soon ? "Join the waitlist" : "Get started"}
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>

            <aside className="aside-card reveal" aria-label="Product facts">
              <ul className="facts">
                <li>
                  <span>By</span>
                  <b>iSoftwareCare</b>
                </li>
                <li>
                  <span>Type</span>
                  <b>{label(product.type)}</b>
                </li>
                <li>
                  <span>Status</span>
                  <b>{label(product.status)}</b>
                </li>
                {[
                  ["Demo", product.demoUrl],
                  ["Website", product.liveUrl],
                ].map(
                  ([name, href]) =>
                    href && (
                      <li key={name}>
                        <span>{name}</span>
                        <b>
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            Open ↗
                          </a>
                        </b>
                      </li>
                    ),
                )}
              </ul>
              {product.techStack.length > 0 && (
                <div className="chips" style={{ marginTop: 18 }}>
                  {product.techStack.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {!discontinued && (
                <Link href="/contact" className="btn btn-solid" style={{ marginTop: 24 }}>
                  {soon ? "Get notified" : "Talk to us"}
                  <Icon name="arrow" strokeWidth={2} />
                </Link>
              )}
            </aside>
          </div>
        </div>
      </section>

      <CTA settings={settings} />
      <Motion />
    </>
  );
}
