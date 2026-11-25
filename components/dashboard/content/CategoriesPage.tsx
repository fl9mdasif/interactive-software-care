"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useCreateCategoryMutation, useDeleteCategoryMutation, useGetAllCategoriesQuery,
  useToggleCategoryStatusMutation, useUpdateCategoryMutation,
} from "@/redux/api/categoryApi";
import type { TCategory } from "@/types";
import { run } from "../toast";
import { Badge, Button, Card, ConfirmDialog, ErrorState, Field, Input, Loading, Modal, PageHeader, Table, Textarea } from "../ui";

function CategoryModal({ category, onClose }: { category?: TCategory; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [create, creating] = useCreateCategoryMutation();
  const [update, updating] = useUpdateCategoryMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description };
    const saved = category
      ? await run(update({ id: category._id!, data }), "Category updated")
      : await run(create(data), "Category created");
    if (saved) onClose();
  };

  return (
    <Modal title={category ? "Edit category" : "New category"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" busy={creating.isLoading || updating.isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CategoriesPage() {
  const { data, error, refetch } = useGetAllCategoriesQuery();
  const [toggle] = useToggleCategoryStatusMutation();
  const [remove, removing] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<TCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<TCategory | null>(null);

  return (
    <>
      <PageHeader title="Categories" description="Used to group projects on the website.">
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New category
        </Button>
      </PageHeader>

      {error ? (
        <ErrorState error={error} retry={refetch} />
      ) : !data ? (
        <Loading />
      ) : (
        <Card>
          <Table
            rows={data}
            rowKey={(c) => c._id!}
            empty="No categories yet."
            columns={[
              { header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
              { header: "Description", cell: (c) => <span className="text-text-mid">{c.description || "—"}</span> },
              { header: "Status", cell: (c) => <Badge value={c.isActive ? "active" : "inactive"} /> },
              {
                header: "",
                className: "text-right whitespace-nowrap",
                cell: (c) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => run(toggle(c._id!), "Status changed")}>
                      {c.isActive ? "Hide" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {editing && <CategoryModal category={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="A category that projects or services still use cannot be deleted."
          busy={removing.isLoading}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            if (await run(remove(deleting._id!), "Category deleted")) setDeleting(null);
          }}
        />
      )}
    </>
  );
}
