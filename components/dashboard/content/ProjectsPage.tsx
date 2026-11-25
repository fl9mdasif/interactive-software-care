"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PROJECT_STATUSES } from "@/lib/constants";
import { categoryName } from "@/lib/utils";
import { useDeleteProjectMutation, useGetProjectsQuery } from "@/redux/api/contentApi";
import { run } from "../toast";
import { Badge, EmptyState, ErrorState, LinkButton, Loading, PageHeader, SearchInput, Select } from "../ui";
import { ContentCard, GRID } from "./shared";

export function ProjectsPage() {
  const { data, error, refetch } = useGetProjectsQuery();
  const [remove, removing] = useDeleteProjectMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const term = search.trim().toLowerCase();
  const items = data?.filter(
    (p) => (!status || p.status === status) && `${p.title} ${p.client ?? ""}`.toLowerCase().includes(term),
  );

  return (
    <>
      <PageHeader title="Projects" description="Client work we delivered. Shown on the website under Work.">
        <LinkButton href="/dashboard/projects/new">
          <Plus className="size-4" /> Add project
        </LinkButton>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or client" />
        <Select className="w-48" aria-label="Status" placeholder="All statuses" options={PROJECT_STATUSES} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !items ? (
        <Loading />
      ) : !items.length ? (
        <EmptyState message={data?.length ? "No projects match." : "No projects yet. The website shows sample work until you add one."} />
      ) : (
        <div className={GRID}>
          {items.map((p) => (
            <ContentCard
              key={p._id}
              title={p.title}
              subtitle={[p.client, categoryName(p.category)].filter(Boolean).join(" · ")}
              image={p.thumbnail}
              featured={p.isFeatured}
              badge={p.status && <Badge value={p.status} />}
              href={`/dashboard/projects/${p._id}`}
              deleting={removing.isLoading}
              onDelete={() => run(remove(p._id), "Project deleted")}
            />
          ))}
        </div>
      )}
    </>
  );
}
