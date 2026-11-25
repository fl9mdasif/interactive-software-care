"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PROJECT_STATUSES } from "@/lib/constants";
import { categoryId } from "@/lib/utils";
import { useGetAllCategoriesQuery } from "@/redux/api/categoryApi";
import { useGetProjectQuery, useSaveProjectMutation } from "@/redux/api/contentApi";
import { toPlainText } from "@/lib/richText";
import { GalleryUploader, ImageUploader } from "@/services/ImageUploader";
import type { TPortfolioItem } from "@/types";
import { RichTextEditor } from "../RichTextEditor";
import { run } from "../toast";
import { Button, Card, Checkbox, ErrorState, Field, Input, LinkButton, Loading, PageHeader, Select, Textarea } from "../ui";
import { toList } from "./shared";

function Form({ project }: { project?: TPortfolioItem }) {
  const router = useRouter();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [save, { isLoading }] = useSaveProjectMutation();
  const [form, setForm] = useState({
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    client: project?.client ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "delivered",
    category: (project && categoryId(project.category)) || "",
    techStack: project?.techStack.join(", ") ?? "",
    liveUrl: project?.liveUrl ?? "",
    order: String(project?.order ?? 0),
    metaTitle: project?.metaTitle ?? "",
    metaDescription: project?.metaDescription ?? "",
  });
  const [thumbnail, setThumbnail] = useState(project?.thumbnail ?? "");
  const [gallery, setGallery] = useState(project?.gallery ?? []);
  const [isFeatured, setFeatured] = useState(project?.isFeatured ?? false);

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
    const { slug, techStack, order, ...rest } = form;
    const data = {
      ...rest,
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      techStack: toList(techStack, /,/),
      order: Math.trunc(Number(order) || 0),
      thumbnail,
      gallery,
      isFeatured,
    };
    if (await run(save({ id: project?._id, data }), project ? "Project updated" : "Project published")) {
      router.push("/dashboard/projects");
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[3fr_2fr]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card title="Project">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title *" className="sm:col-span-2">
              <Input {...bind("title")} required />
            </Field>
            <Field label="Client / brand">
              <Input {...bind("client")} />
            </Field>
            <Field label="Status" hint="Shown on the website">
              <Select {...bind("status")} options={PROJECT_STATUSES} />
            </Field>
            <Field label="Category *" hint={categories.length ? undefined : "Create a category first."}>
              <Select {...bind("category")} required placeholder="Choose…" options={categories.map((c) => ({ value: c._id!, label: c.name }))} />
            </Field>
            <div className="sm:col-span-2">
              <RichTextEditor
                label="Description *"
                value={form.description}
                onChange={(description) => setForm((f) => ({ ...f, description }))}
              />
            </div>
            <Field label="Tech stack" hint="Comma separated" className="sm:col-span-2">
              <Input {...bind("techStack")} placeholder="Next.js, Node.js, MongoDB" />
            </Field>
            <Field label="Live URL" className="sm:col-span-2">
              <Input {...bind("liveUrl")} type="url" placeholder="https://" />
            </Field>
          </div>
        </Card>
        <Card title="Search and ordering">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="URL slug" hint="Blank: made from the title">
              <Input {...bind("slug")} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            </Field>
            <Field label="Position" hint="Lower numbers come first">
              <Input {...bind("order")} type="number" step="1" />
            </Field>
            <Field label="Meta title" className="sm:col-span-2">
              <Input {...bind("metaTitle")} />
            </Field>
            <Field label="Meta description" className="sm:col-span-2">
              <Textarea {...bind("metaDescription")} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Card title="Cover image *">
          <ImageUploader folder="projects" value={thumbnail} onChange={setThumbnail} />
        </Card>
        <Card title="Screenshots">
          <GalleryUploader folder="projects" value={gallery} onChange={setGallery} />
        </Card>
        <Card>
          <Checkbox label="Feature on the home page" checked={isFeatured} onChange={(e) => setFeatured(e.target.checked)} />
          <div className="mt-4 flex justify-end gap-2">
            <LinkButton href="/dashboard/projects" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" busy={isLoading}>
              {project ? "Save changes" : "Publish project"}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}

export function ProjectEditor({ id }: { id?: string }) {
  const { data, error, refetch } = useGetProjectQuery(id!, { skip: !id });
  return (
    <>
      <PageHeader title={id ? "Edit project" : "Add project"} />
      {!id ? <Form /> : error ? <ErrorState error={error} retry={refetch} /> : !data ? <Loading /> : <Form key={data._id} project={data} />}
    </>
  );
}
