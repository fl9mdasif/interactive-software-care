"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useChangePasswordMutation, useUpdateProfileMutation } from "@/redux/api/authApi";
import { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } from "@/redux/api/contentApi";
import { removeUser } from "@/services/auth.services";
import type { TSettings, TUser } from "@/types";
import { run } from "./toast";
import { Button, Card, ErrorState, Field, Input, Loading, PageHeader, Textarea } from "./ui";
import { useRole } from "./useRole";

// The old token stops working after these changes, so sign in again.
const signInAgain = () => {
  removeUser();
  window.location.assign("/login");
};

function Profile({ me }: { me: TUser }) {
  const [username, setUsername] = useState(me.username);
  const [email, setEmail] = useState(me.email);
  const [contactNumber, setContactNumber] = useState(me.contactNumber ?? "");
  const [update, { isLoading }] = useUpdateProfileMutation();

  return (
    <Card title="My profile">
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const saved = await run(update({ username, email, contactNumber }), "Profile saved");
          if (saved && email !== me.email) signInAgain();
        }}
      >
        <Field label="Name">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={50} />
        </Field>
        <Field label="Email" hint="Changing it signs you out.">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Phone">
          <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" busy={isLoading}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Password() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [change, { isLoading }] = useChangePasswordMutation();

  return (
    <Card title="Change password">
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(change({ oldPassword, newPassword }), "Password changed. Log in again.")) signInAgain();
        }}
      >
        <Field label="Current password">
          <Input type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} autoComplete="new-password" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" busy={isLoading}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

const SITE_FIELDS = [
  { key: "contactEmail", label: "Contact email", type: "email" },
  { key: "contactPhone", label: "Contact phone", type: "text" },
  { key: "whatsappNumber", label: "WhatsApp number", type: "text" },
  { key: "gaId", label: "Google Analytics ID", type: "text" },
  { key: "gtmId", label: "Google Tag Manager ID", type: "text" },
  { key: "fbPixelId", label: "Meta Pixel ID", type: "text" },
  { key: "searchConsoleTag", label: "Search Console verification", type: "text" },
] as const;

type SiteKey = (typeof SITE_FIELDS)[number]["key"] | "officeAddress";

function SiteForm({ settings }: { settings: TSettings }) {
  const [form, setForm] = useState(
    () =>
      Object.fromEntries(
        [...SITE_FIELDS.map((f) => f.key), "officeAddress" as const].map((key) => [key, settings[key] ?? ""]),
      ) as Record<SiteKey, string>,
  );
  const [links, setLinks] = useState(() => (settings.socialLinks ?? []).map(({ platform, url }) => ({ platform, url })));
  const [update, { isLoading }] = useUpdateSiteSettingsMutation();
  const setLink = (i: number, patch: Partial<(typeof links)[number]>) =>
    setLinks((all) => all.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  return (
    <Card title="Website settings" className="xl:col-span-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(update({ ...form, socialLinks: links }), "Website settings saved. The site updates within 5 minutes.");
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {SITE_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input type={f.type} value={form[f.key]} onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))} />
          </Field>
        ))}
        <Field label="Office address" className="sm:col-span-2">
          <Textarea value={form.officeAddress} onChange={(e) => setForm((v) => ({ ...v, officeAddress: e.target.value }))} />
        </Field>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1.5 text-xs font-medium text-text-mid">Social links</legend>
          {links.map((link, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <Input className="w-40" aria-label="Platform" placeholder="Facebook" required value={link.platform} onChange={(e) => setLink(i, { platform: e.target.value })} />
              <Input className="min-w-0 flex-1" aria-label="Link" type="url" placeholder="https://" required value={link.url} onChange={(e) => setLink(i, { url: e.target.value })} />
              <Button variant="ghost" aria-label="Remove link" onClick={() => setLinks((all) => all.filter((_, n) => n !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <div>
            <Button variant="secondary" size="sm" onClick={() => setLinks((all) => [...all, { platform: "", url: "" }])}>
              <Plus className="size-3.5" /> Add link
            </Button>
          </div>
        </fieldset>

        <p className="text-xs text-text-dim sm:col-span-2">A field left blank uses the website&apos;s built-in default.</p>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" busy={isLoading}>
            Save website settings
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SiteSettings() {
  const { data, error, refetch } = useGetSiteSettingsQuery();
  if (error) return <ErrorState error={error} retry={refetch} />;
  return data ? <SiteForm settings={data} /> : <Loading />;
}

export function SettingsPage() {
  const { me, isAdmin } = useRole();
  if (!me) return <Loading />;
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Profile key={me._id} me={me} />
        <Password />
        {isAdmin && <SiteSettings />}
      </div>
    </>
  );
}
