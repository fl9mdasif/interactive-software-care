"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, label } from "@/lib/format";
import {
  useActivateUserMutation, useCreateStaffMutation, useDeactivateUserMutation, useGetAllUsersQuery, useUpdateUserMutation,
} from "@/redux/api/userApi";
import type { TUser, UserRole } from "@/types";
import { run } from "./toast";
import { Badge, Button, Card, ConfirmDialog, ErrorState, Field, Input, Loading, Modal, PageHeader, Pagination, SearchInput, Select, Table } from "./ui";
import { useRole } from "./useRole";

function UserModal({ user, onClose }: { user?: TUser; onClose: () => void }) {
  const { me } = useRole();
  const isSuper = me?.role === "superAdmin";
  const [create, creating] = useCreateStaffMutation();
  const [update, updating] = useUpdateUserMutation();
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    contactNumber: user?.contactNumber ?? "",
    password: "",
    role: (user?.role ?? "staff") as UserRole,
  });
  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  // Only a superAdmin picks roles, and a superAdmin account's role is fixed.
  const roleEditable = isSuper && user?.role !== "superAdmin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { password, role, contactNumber, ...base } = form;
    const saved = user
      ? await run(
          update({
            id: user._id!,
            data: { ...base, ...(contactNumber ? { contactNumber } : {}), ...(roleEditable && role !== user.role ? { role } : {}) },
          }),
          "User updated",
        )
      : await run(create({ ...base, contactNumber, password, role }), "Account created");
    if (saved) onClose();
  };

  return (
    <Modal title={user ? "Edit user" : "New team member"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *">
          <Input {...bind("username")} required maxLength={50} autoComplete="off" />
        </Field>
        <Field label="Role">
          <Select {...bind("role")} disabled={!roleEditable} options={user?.role === "superAdmin" ? ["superAdmin"] : ["staff", "admin"]} />
        </Field>
        <Field label="Email *">
          <Input {...bind("email")} type="email" required autoComplete="off" />
        </Field>
        <Field label={user ? "Phone" : "Phone *"}>
          <Input {...bind("contactNumber")} required={!user} />
        </Field>
        {!user && (
          <Field label="Password *" hint="8 to 30 characters" className="sm:col-span-2">
            <Input {...bind("password")} type="password" minLength={8} maxLength={30} required autoComplete="new-password" />
          </Field>
        )}
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" busy={creating.isLoading || updating.isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersPage() {
  const { me } = useRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebouncedValue(search, 350);
  const { data, error, refetch } = useGetAllUsersQuery({ page, limit: 20, ...(term ? { search: term } : {}) });
  const [editing, setEditing] = useState<TUser | "new" | null>(null);
  const [blocking, setBlocking] = useState<TUser | null>(null);
  const [deactivate, deactivating] = useDeactivateUserMutation();
  const [activate] = useActivateUserMutation();

  const canManage = (u: TUser) => u.role !== "superAdmin" || me?.role === "superAdmin";

  return (
    <>
      <PageHeader title="Users" description="Team accounts. Staff handle orders and leads; admins also see sales and manage content.">
        <Button onClick={() => setEditing("new")}>
          <UserPlus className="size-4" /> Add user
        </Button>
      </PageHeader>
      <div className="mb-4 flex">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name or email"
        />
      </div>

      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !data ? (
        <Loading />
      ) : (
        <Card>
          <Table
            rows={data.items}
            rowKey={(u) => u._id!}
            empty="No users match."
            columns={[
              {
                header: "User",
                cell: (u) => (
                  <div className="min-w-44">
                    <span className="font-medium">{u.username}</span>
                    <span className="block text-xs text-text-dim">{u.email}</span>
                  </div>
                ),
              },
              { header: "Phone", cell: (u) => u.contactNumber || "—" },
              { header: "Role", cell: (u) => <span className="whitespace-nowrap">{label(u.role)}</span> },
              { header: "Status", cell: (u) => <Badge value={u.isBlocked ? "deactivated" : "active"} /> },
              { header: "Joined", cell: (u) => <span className="whitespace-nowrap">{formatDate(u.createdAt)}</span> },
              {
                header: "",
                className: "text-right whitespace-nowrap",
                cell: (u) =>
                  canManage(u) && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                        Edit
                      </Button>
                      {u._id !== me?._id && u.role !== "superAdmin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (u.isBlocked ? run(activate(u._id!), "Account activated") : setBlocking(u))}
                        >
                          {u.isBlocked ? "Activate" : "Deactivate"}
                        </Button>
                      )}
                    </div>
                  ),
              },
            ]}
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </Card>
      )}

      {editing && <UserModal user={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {blocking && (
        <ConfirmDialog
          title={`Deactivate ${blocking.username}?`}
          message="They lose access immediately and cannot log in until activated again."
          confirmLabel="Deactivate"
          busy={deactivating.isLoading}
          onClose={() => setBlocking(null)}
          onConfirm={async () => {
            if (await run(deactivate(blocking._id!), "Account deactivated")) setBlocking(null);
          }}
        />
      )}
    </>
  );
}
