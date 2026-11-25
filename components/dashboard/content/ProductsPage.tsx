"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { label } from "@/lib/format";
import { useDeleteProductMutation, useGetAdminProductsQuery } from "@/redux/api/contentApi";
import { run } from "../toast";
import { Badge, EmptyState, ErrorState, LinkButton, Loading, PageHeader, SearchInput, Select } from "../ui";
import { ContentCard, GRID } from "./shared";

export function ProductsPage() {
  const { data, error, refetch } = useGetAdminProductsQuery();
  const [remove, removing] = useDeleteProductMutation();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const term = search.trim().toLowerCase();
  const items = data?.filter((p) => (!type || p.type === type) && (!status || p.status === status) && `${p.name} ${p.tagline}`.toLowerCase().includes(term));

  return (
    <>
      <PageHeader title="Products" description="ISC's own SaaS and AI products. Drafts are hidden from the website.">
        <LinkButton href="/dashboard/products/new">
          <Plus className="size-4" /> Add product
        </LinkButton>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products" />
        <Select className="w-36" aria-label="Type" placeholder="All types" options={["saas", "ai", "tool"]} value={type} onChange={(e) => setType(e.target.value)} />
        <Select className="w-48" aria-label="Status" placeholder="All statuses" options={PRODUCT_STATUSES} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !items ? (
        <Loading />
      ) : !items.length ? (
        <EmptyState message={data?.length ? "No products match." : "No products yet."} />
      ) : (
        <div className={GRID}>
          {items.map((p) => (
            <ContentCard
              key={p._id}
              title={p.name}
              subtitle={`${label(p.type)} · ${p.tagline}`}
              image={p.thumbnail}
              featured={p.isFeatured}
              badge={<Badge value={p.status} />}
              href={`/dashboard/products/${p._id}`}
              deleting={removing.isLoading}
              onDelete={() => run(remove(p._id), "Product deleted")}
            />
          ))}
        </div>
      )}
    </>
  );
}
