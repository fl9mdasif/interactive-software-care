"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, label } from "@/lib/format";
import { useGetLeadsQuery, useUpdateLeadStatusMutation } from "@/redux/api/leadApi";
import type { TLead, TLeadStatus } from "@/types";
import { run } from "./toast";
import { Badge, Button, Card, Column, ErrorState, LinkButton, Loading, Modal, PageHeader, Pagination, SearchInput, Select, Table } from "./ui";

const STATUSES: TLeadStatus[] = ["new", "contacted", "converted", "lost"];

function Action({ lead }: { lead: TLead }) {
  return lead.order ? (
    <LinkButton href={`/dashboard/orders/${lead.order._id}`} variant="secondary" size="sm">
      {lead.order.orderNo}
    </LinkButton>
  ) : (
    <LinkButton href={`/dashboard/orders/new?lead=${lead._id}`} size="sm">
      Convert to order <ArrowRight className="size-3.5" />
    </LinkButton>
  );
}

export function LeadsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<TLead | null>(null);
  const term = useDebouncedValue(search, 350);
  const { data, error, refetch } = useGetLeadsQuery({
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(term ? { search: term } : {}),
  });
  const [update] = useUpdateLeadStatusMutation();

  const columns: Column<TLead>[] = [
    {
      header: "Lead",
      cell: (l) => (
        <button type="button" onClick={() => setOpen(l)} className="block min-w-44 cursor-pointer text-left hover:text-acid">
          <span className="font-medium">{l.name}</span>
          <span className="block text-xs text-text-dim">{l.email}</span>
        </button>
      ),
    },
    {
      header: "Message",
      cell: (l) => <span className="line-clamp-2 block min-w-56 max-w-md text-xs text-text-mid">{l.message}</span>,
    },
    { header: "Service", cell: (l) => l.serviceInterested?.title ?? "—" },
    { header: "Budget", cell: (l) => <span className="whitespace-nowrap">{l.budget || "—"}</span> },
    { header: "Received", cell: (l) => <span className="whitespace-nowrap">{formatDate(l.createdAt)}</span> },
    {
      header: "Status",
      cell: (l) => (
        <Select
          className="h-8 w-32 text-xs"
          aria-label={`Status of ${l.name}`}
          options={STATUSES}
          value={l.status}
          onChange={(e) => run(update({ id: l._id, status: e.target.value as TLeadStatus }), `Marked ${label(e.target.value)}`)}
        />
      ),
    },
    { header: "", cell: (l) => <Action lead={l} />, className: "text-right whitespace-nowrap" },
  ];

  return (
    <>
      <PageHeader title="Leads" description="Enquiries from the website contact form." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name or email"
        />
        <Select
          className="w-40"
          aria-label="Status"
          placeholder="All statuses"
          options={STATUSES}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !data ? (
        <Loading />
      ) : (
        <Card>
          <Table columns={columns} rows={data.items} rowKey={(l) => l._id} empty="No leads match." />
          <Pagination meta={data.meta} onPage={setPage} />
        </Card>
      )}

      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          <p className="flex flex-wrap items-center gap-2 text-sm text-text-mid">
            <Badge value={open.status} />
            <a className="hover:text-acid" href={`mailto:${open.email}`}>{open.email}</a>
            {open.phone && <a className="hover:text-acid" href={`tel:${open.phone}`}>{open.phone}</a>}
          </p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm">{open.message}</p>
          <p className="mt-3 text-xs text-text-dim">
            {[open.serviceInterested?.title, open.budget, open.source && `from ${open.source}`, formatDate(open.createdAt)].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(null)}>
              Close
            </Button>
            <Action lead={open} />
          </div>
        </Modal>
      )}
    </>
  );
}
