"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { Loader2, UploadCloud, X } from "lucide-react";
import { authKey } from "@/contains/authKey";
import { cld } from "@/lib/cloudinary";
import { getFromLocalStorage } from "@/utils/local-storage";
import { compressImage } from "./compressImage";

type Folder = "projects" | "products";

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

async function upload(file: File, folder: Folder) {
  const compressed = await compressImage(file);
  const form = new FormData();
  form.append("file", compressed);
  form.append("folder", folder);
  try {
    const { data } = await axios.post<{ url: string }>("/api/upload", form, {
      headers: { Authorization: getFromLocalStorage(authKey) ?? "" },
    });
    return { url: data.url, note: `${kb(file.size)} → ${kb(compressed.size)}` };
  } catch (error) {
    const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
    throw new Error(message || "Upload failed.");
  }
}

function Dropzone({ busy, multiple, onFiles }: { busy: boolean; multiple?: boolean; onFiles: (files: File[]) => void }) {
  return (
    <label
      className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-surface-2 p-3 text-center transition-colors hover:border-acid focus-within:border-acid"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!busy) onFiles([...e.dataTransfer.files]);
      }}
    >
      {busy ? <Loader2 className="size-6 animate-spin text-acid" /> : <UploadCloud className="size-6 text-text-dim" />}
      <span className="text-sm text-text-mid">
        {busy ? "Compressing and uploading…" : multiple ? "Add images (click or drop)" : "Click or drop an image"}
      </span>
      <span className="text-xs text-text-dim">Compressed to 120 KB or less before upload</span>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Thumb({ url, alt, onRemove }: { url: string; alt: string; onRemove: () => void }) {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-line bg-surface-2">
      <Image src={cld(url, { w: 600, h: 400, crop: "fit" })} alt={alt} fill unoptimized className="object-contain" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${alt}`}
        className="absolute right-2 top-2 rounded-lg bg-black/65 p-1.5 text-white hover:bg-black/85"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ImageUploader({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: Folder }) {
  const [busy, setBusy] = useState(false);

  const onFiles = async ([file]: File[]) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url, note } = await upload(file, folder);
      onChange(url);
      toast.success(`Uploaded: ${note}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return value ? <Thumb url={value} alt="cover image" onRemove={() => onChange("")} /> : <Dropzone busy={busy} onFiles={onFiles} />;
}

export function GalleryUploader({
  value,
  onChange,
  folder,
  max = 12,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: Folder;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: File[]) => {
    const room = max - value.length;
    if (files.length > room) toast.error(`Only ${room} more image${room === 1 ? "" : "s"} can be added.`);
    setBusy(true);
    // One at a time, keeping every success even if a later file fails.
    let urls = value;
    for (const file of files.slice(0, room)) {
      try {
        const { url, note } = await upload(file, folder);
        urls = [...urls, url];
        onChange(urls);
        toast.success(`${file.name}: ${note}`);
      } catch (error) {
        toast.error(`${file.name}: ${(error as Error).message}`);
      }
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {value.map((url, i) => (
        <Thumb key={url} url={url} alt={`gallery image ${i + 1}`} onRemove={() => onChange(value.filter((u) => u !== url))} />
      ))}
      {value.length < max && <Dropzone busy={busy} multiple onFiles={onFiles} />}
    </div>
  );
}
