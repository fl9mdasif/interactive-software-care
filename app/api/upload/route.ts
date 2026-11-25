import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/site";

const MAX_BYTES = 120 * 1024;
const TYPES = ["image/webp", "image/jpeg", "image/png"];
const FOLDERS = ["projects", "products"];

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });

/**
 * Signed Cloudinary upload. The API secret stays on this server, and only a
 * signed-in admin (checked against the API) can use it.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization");
  if (!token) return fail("Please log in.", 401);

  const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: token }, cache: "no-store" }).catch(() => null);
  if (!me) return fail("The API server is not reachable.", 502);
  if (!me.ok) return fail("Please log in again.", 401);
  const role = (await me.json())?.data?.role;
  if (role !== "admin" && role !== "superAdmin") return fail("Only an admin can upload images.", 403);

  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloud || !key || !secret) {
    return fail("Cloudinary is not set up. Add the CLOUDINARY_* values to .env.local and restart.", 503);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const requested = String(form?.get("folder") ?? "");
  if (!(file instanceof File)) return fail("No image received.", 400);
  if (!TYPES.includes(file.type)) return fail("Only WebP, JPG or PNG images are allowed.", 415);
  if (file.size > MAX_BYTES) return fail("Image is larger than 120 KB.", 413);

  const folder = `isc/${FOLDERS.includes(requested) ? requested : "projects"}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  // Cloudinary signs the parameters in alphabetical order, followed by the secret.
  // `asset_folder` is the folder setting for accounts in dynamic folder mode.
  const signature = createHash("sha1").update(`asset_folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("asset_folder", folder);
  upload.append("timestamp", timestamp);
  upload.append("api_key", key);
  upload.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: upload,
  }).catch(() => null);
  const result = await response?.json().catch(() => null);

  if (!response?.ok || !result?.secure_url) {
    return fail(result?.error?.message ?? "Cloudinary upload failed.", 502);
  }
  return NextResponse.json({ success: true, url: result.secure_url as string });
}
