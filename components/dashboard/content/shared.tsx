"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import { CldImg } from "@/components/ui/CldImg";
import { Button, ConfirmDialog, LinkButton } from "../ui";

export const toList = (text: string, separator: RegExp) => text.split(separator).map((s) => s.trim()).filter(Boolean);

/** Card for one project or product in the dashboard grid. */
export function ContentCard({
  title, subtitle, image, href, featured, badge, deleting, onDelete,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  featured?: boolean;
  badge?: React.ReactNode;
  deleting?: boolean;
  onDelete: () => Promise<unknown>;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <Link href={href} className="relative block aspect-[16/10] bg-surface-2" aria-label={`Edit ${title}`}>
        {image && <CldImg src={image} alt="" w={640} h={400} sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
        {featured && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-xs text-white">
            <Star className="size-3" /> Featured
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="line-clamp-2 text-xs text-text-dim">{subtitle}</p>}
        <div className="mt-auto flex justify-end gap-2 pt-2">
          <LinkButton href={href} variant="secondary" size="sm">
            <Pencil className="size-3.5" /> Edit
          </LinkButton>
          <Button variant="danger" size="sm" aria-label={`Delete ${title}`} onClick={() => setConfirm(true)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title={`Delete ${title}?`}
          message="It is removed from the website. This cannot be undone."
          busy={deleting}
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            if (await onDelete()) setConfirm(false);
          }}
        />
      )}
    </article>
  );
}

export const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
