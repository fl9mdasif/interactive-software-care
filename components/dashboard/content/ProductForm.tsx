"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useGetAdminProductsQuery, useSaveProductMutation } from "@/redux/api/contentApi";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { label } from "@/lib/format";
import { toPlainText } from "@/lib/richText";
import { GalleryUploader, ImageUploader } from "@/services/ImageUploader";
import type { TPricingPlan, TProduct } from "@/types";
import { RichTextEditor } from "../RichTextEditor";
import { run } from "../toast";
import { Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, LinkButton, Loading, PageHeader, Select, Textarea } from "../ui";
import { toList } from "./shared";

type PlanDraft = {
  id: number;
  name: string;
  price: string;
  currency: TPricingPlan["currency"];
  period: TPricingPlan["period"];
  features: string;
};

let planId = 0;
const draft = (p?: TPricingPlan): PlanDraft => ({
  id: ++planId,
  name: p?.name ?? "",
  price: p ? String(p.price) : "",
  currency: p?.currency ?? "BDT",
  period: p?.period ?? "month",
  features: p?.features.join("\n") ?? "",
});

function Plans({ plans, onChange }: { plans: PlanDraft[]; onChange: (plans: PlanDraft[]) => void }) {
  const set = (id: number, patch: Partial<PlanDraft>) => onChange(plans.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <Card
      title="Pricing plans"
      action={
        plans.length < 8 && (
          <Button variant="secondary" size="sm" onClick={() => onChange([...plans, draft()])}>
            <Plus className="size-3.5" /> Add plan
          </Button>
        )
      }
    >
      {!plans.length && <p className="text-sm text-text-dim">No plans. The product page shows a contact button instead.</p>}
      <div className="flex flex-col gap-4">
        {plans.map((plan, i) => (
          <fieldset key={plan.id} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-4">
            <legend className="px-1 text-xs text-text-dim">Plan {i + 1}</legend>
            <Field label="Name *" className="sm:col-span-4">
              <Input value={plan.name} required onChange={(e) => set(plan.id, { name: e.target.value })} placeholder="Starter" />
            </Field>
            <Field label="Price *" className="sm:col-span-2">
              <Input type="number" min="0" step="0.01" required value={plan.price} onChange={(e) => set(plan.id, { price: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select
                options={[{ value: "BDT", label: "BDT" }, { value: "USD", label: "USD" }]}
                value={plan.currency}
                onChange={(e) => set(plan.id, { currency: e.target.value as PlanDraft["currency"] })}
              />
            </Field>
            <Field label="Billed">
              <Select
                options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }, { value: "once", label: "One-time" }]}
                value={plan.period}
                onChange={(e) => set(plan.id, { period: e.target.value as PlanDraft["period"] })}
              />
            </Field>
            <Field label="Included" hint="One per line" className="sm:col-span-4">
              <Textarea value={plan.features} onChange={(e) => set(plan.id, { features: e.target.value })} />
            </Field>
            <div className="flex justify-end sm:col-span-4">
              <Button variant="ghost" size="sm" onClick={() => onChange(plans.filter((p) => p.id !== plan.id))}>
                <Trash2 className="size-3.5" /> Remove plan
              </Button>
            </div>
          </fieldset>
        ))}
      </div>
    </Card>
  );
}

function Form({ product }: { product?: TProduct }) {
  const router = useRouter();
  const [save, { isLoading }] = useSaveProductMutation();
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    tagline: product?.tagline ?? "",
    description: product?.description ?? "",
    type: product?.type ?? "saas",
    status: product?.status ?? "draft",
    features: product?.features.join("\n") ?? "",
    techStack: product?.techStack.join(", ") ?? "",
    demoUrl: product?.demoUrl ?? "",
    liveUrl: product?.liveUrl ?? "",
    order: String(product?.order ?? 0),
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
  });
  const [thumbnail, setThumbnail] = useState(product?.thumbnail ?? "");
  const [gallery, setGallery] = useState(product?.gallery ?? []);
  const [isFeatured, setFeatured] = useState(product?.isFeatured ?? false);
  const [plans, setPlans] = useState(() => product?.pricingPlans.map(draft) ?? []);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toPlainText(form.description)) {
      toast.error("Write a description.");
      return;
    }
    if (!thumbnail) {
      toast.error("Add a cover image.");
      return;
    }
    const { slug, features, techStack, order, ...rest } = form;
    const data = {
      ...rest,
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      features: toList(features, /\n/),
      techStack: toList(techStack, /,/),
      order: Math.trunc(Number(order) || 0),
      pricingPlans: plans.map((p) => ({
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        period: p.period,
        features: toList(p.features, /\n/),
      })),
      thumbnail,
      gallery,
      isFeatured,
    };
    if (await run(save({ id: product?._id, data }), "Product saved")) router.push("/dashboard/products");
  };

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[3fr_2fr]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card title="Product">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *" className="sm:col-span-2">
              <Input {...bind("name")} required maxLength={120} />
            </Field>
            <Field label="Tagline *" className="sm:col-span-2">
              <Input {...bind("tagline")} required maxLength={200} />
            </Field>
            <Field label="Type">
              <Select {...bind("type")} options={["saas", "ai", "tool"]} />
            </Field>
            <Field label="Status" hint="Everything except Draft is shown on the website">
              <Select
                {...bind("status")}
                options={PRODUCT_STATUSES.map((value) => ({ value, label: value === "draft" ? "Draft (hidden)" : label(value) }))}
              />
            </Field>
            <div className="sm:col-span-2">
              <RichTextEditor
                label="Description *"
                value={form.description}
                onChange={(description) => setForm((f) => ({ ...f, description }))}
              />
            </div>
            <Field label="Features" hint="One per line" className="sm:col-span-2">
              <Textarea {...bind("features")} className="min-h-32" />
            </Field>
            <Field label="Tech stack" hint="Comma separated" className="sm:col-span-2">
              <Input {...bind("techStack")} />
            </Field>
            <Field label="Demo URL">
              <Input {...bind("demoUrl")} type="url" placeholder="https://" />
            </Field>
            <Field label="Live URL">
              <Input {...bind("liveUrl")} type="url" placeholder="https://" />
            </Field>
          </div>
        </Card>
        <Plans plans={plans} onChange={setPlans} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Card title="Cover image *">
          <ImageUploader folder="products" value={thumbnail} onChange={setThumbnail} />
        </Card>
        <Card title="Screenshots">
          <GalleryUploader folder="products" value={gallery} onChange={setGallery} />
        </Card>
        <Card title="Search and ordering">
          <div className="grid gap-3">
            <Field label="URL slug" hint="Blank: made from the name">
              <Input {...bind("slug")} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            </Field>
            <Field label="Position" hint="Lower numbers come first">
              <Input {...bind("order")} type="number" step="1" />
            </Field>
            <Field label="Meta title">
              <Input {...bind("metaTitle")} />
            </Field>
            <Field label="Meta description">
              <Textarea {...bind("metaDescription")} />
            </Field>
            <Checkbox label="Featured product" checked={isFeatured} onChange={(e) => setFeatured(e.target.checked)} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <LinkButton href="/dashboard/products" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" busy={isLoading}>
              Save product
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}

export function ProductEditor({ id }: { id?: string }) {
  const { data, error, refetch } = useGetAdminProductsQuery(undefined, { skip: !id });
  const product = data?.find((p) => p._id === id);

  let body;
  if (!id) body = <Form />;
  else if (error) body = <ErrorState error={error} retry={refetch} />;
  else if (!data) body = <Loading />;
  else if (!product) body = <EmptyState message="Product not found." />;
  else body = <Form key={product._id} product={product} />;

  return (
    <>
      <PageHeader title={id ? "Edit product" : "Add product"} />
      {body}
    </>
  );
}
