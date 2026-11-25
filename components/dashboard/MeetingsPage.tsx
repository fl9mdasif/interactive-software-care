"use client";

import { useState } from "react";
import { ArrowRight, Mail, MessageCircle, NotebookPen, RefreshCw, Video } from "lucide-react";
import toast from "react-hot-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MEETING_OUTCOMES } from "@/lib/constants";
import { whatsappLink } from "@/lib/contactLinks";
import { formatDate, formatTime, label } from "@/lib/format";
import { useGetMeetingsQuery, useSyncMeetingsMutation, useUpdateMeetingMutation } from "@/redux/api/meetingApi";
import type { TMeeting, TMeetingOutcome } from "@/types";
import { run } from "./toast";
import {
  Badge, Button, buttonClass, Card, Column, errorMessage, ErrorState, Field, LinkButton, Loading, Modal, PageHeader,
  Pagination, SearchInput, Select, Table, Textarea,
} from "./ui";
import { useRole } from "./useRole";

const TABS = [
  { id: "upcoming", name: "Upcoming" },
  { id: "past", name: "Past" },
  { id: "cancelled", name: "Cancelled" },
] as const;

function NoteModal({ meeting, onClose }: { meeting: TMeeting; onClose: () => void }) {
  const [note, setNote] = useState(meeting.internalNote ?? "");
  const [update, { isLoading }] = useUpdateMeetingMutation();

  return (
    <Modal title={meeting.title} onClose={onClose}>
      <dl className="mb-4 flex flex-col gap-1 text-sm text-text-mid">
        <p>
          {formatDate(meeting.start)}, {formatTime(meeting.start)} – {formatTime(meeting.end)} (Bangladesh time)
        </p>
        {meeting.attendee.timeZone && <p>Client time zone: {meeting.attendee.timeZone}</p>}
        {meeting.guests.length > 0 && <p className="break-words">Guests: {meeting.guests.join(", ")}</p>}
        {meeting.bookingNote && <p className="whitespace-pre-wrap break-words">Booking note: {meeting.bookingNote}</p>}
        {meeting.cancelReason && <p className="break-words text-danger">Reason: {meeting.cancelReason}</p>}
      </dl>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(update({ id: meeting._id, data: { internalNote: note } }), "Note saved")) onClose();
        }}
        className="flex flex-col gap-3"
      >
        <Field label="Team note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={5000} className="min-h-32" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" busy={isLoading}>
            Save note
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MeetingsPage() {
  const { isAdmin } = useRole();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upcoming");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<TMeeting | null>(null);
  const term = useDebouncedValue(search, 350);
  const { data, error, refetch } = useGetMeetingsQuery(
    { tab, page, limit: 20, ...(term ? { search: term } : {}) },
    // Bookings arrive from outside, so look again now and then.
    { pollingInterval: 60_000, refetchOnMountOrArgChange: true },
  );
  const [update] = useUpdateMeetingMutation();
  const [sync, syncing] = useSyncMeetingsMutation();

  const syncNow = async () => {
    try {
      const result = await sync().unwrap();
      toast.success(`Synced ${result.fetched} bookings: ${result.created} new, ${result.updated} updated`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<TMeeting>[] = [
    {
      header: "When (BD time)",
      cell: (m) => (
        <span className="whitespace-nowrap">
          <b>{formatDate(m.start)}</b>
          <span className="block text-xs text-text-dim">
            {formatTime(m.start)} – {formatTime(m.end)}
          </span>
        </span>
      ),
    },
    {
      header: "Client",
      cell: (m) => (
        <div className="min-w-44">
          {m.attendee.name ?? "—"}
          <span className="block text-xs text-text-dim">{m.attendee.email}</span>
          <span className="mt-1 flex gap-3">
            {m.attendee.email && (
              <a href={`mailto:${m.attendee.email}`} aria-label={`Email ${m.attendee.name}`} className="hover:text-acid">
                <Mail className="size-4" />
              </a>
            )}
            {m.attendee.phone && (
              <a href={whatsappLink(m.attendee.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.attendee.name}`} className="hover:text-acid">
                <MessageCircle className="size-4" />
              </a>
            )}
          </span>
        </div>
      ),
    },
    {
      header: "Meeting",
      cell: (m) => (
        <button type="button" onClick={() => setOpen(m)} className="block min-w-48 cursor-pointer text-left hover:text-acid">
          {m.title}
          <span className="line-clamp-2 block max-w-xs text-xs text-text-dim">{m.internalNote || m.bookingNote}</span>
        </button>
      ),
    },
    { header: "Status", cell: (m) => <Badge value={m.status} /> },
    {
      header: "Outcome",
      cell: (m) => (
        <Select
          className="h-8 w-32 text-xs"
          aria-label={`Outcome of ${m.title}`}
          options={MEETING_OUTCOMES.map((value) => ({ value, label: value === "none" ? "Not set" : label(value) }))}
          value={m.outcome}
          onChange={(e) => run(update({ id: m._id, data: { outcome: e.target.value as TMeetingOutcome } }), "Outcome saved")}
        />
      ),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      cell: (m) => (
        <div className="flex justify-end gap-1">
          {tab === "upcoming" && m.meetingUrl && (
            <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
              <Video className="size-3.5" /> Join
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={() => setOpen(m)} aria-label={`Details and note for ${m.title}`}>
            <NotebookPen className="size-3.5" /> Note
          </Button>
          {m.order ? (
            <LinkButton href={`/dashboard/orders/${m.order._id}`} variant="secondary" size="sm">
              {m.order.orderNo}
            </LinkButton>
          ) : (
            tab !== "cancelled" && (
              <LinkButton href={`/dashboard/orders/new?meeting=${m._id}`} variant="secondary" size="sm">
                To order <ArrowRight className="size-3.5" />
              </LinkButton>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Meetings" description="Bookings made through Cal.com.">
        {isAdmin && (
          <Button variant="secondary" onClick={syncNow} busy={syncing.isLoading}>
            {!syncing.isLoading && <RefreshCw className="size-4" />} Sync from Cal.com
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex gap-1" role="group" aria-label="Show">
          {TABS.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "primary" : "secondary"}
              aria-pressed={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
            >
              {t.name}
            </Button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search client or title"
        />
      </div>

      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !data ? (
        <Loading />
      ) : (
        <Card>
          <Table columns={columns} rows={data.items} rowKey={(m) => m._id} empty={`No ${tab} meetings.`} />
          <Pagination meta={data.meta} onPage={setPage} />
        </Card>
      )}
      {open && <NoteModal key={open._id} meeting={open} onClose={() => setOpen(null)} />}
    </>
  );
}
