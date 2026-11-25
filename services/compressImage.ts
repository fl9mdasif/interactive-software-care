export const MAX_BYTES = 120 * 1024;
const TARGET_BYTES = 110 * 1024;
const MIN_USEFUL_BYTES = 90 * 1024;
const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.55;
const MAX_QUALITY = 0.92;

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image"))), type, quality),
  );

function draw(source: ImageBitmap, scale: number, background?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Resize and re-encode an image in the browser to 120 KB or less, aiming for
 * about 100 KB. Quality is searched first; dimensions shrink only when the
 * lowest acceptable quality is still too large. A simple image that is small
 * even at top quality is returned small rather than padded.
 */
export async function compressImage(file: File): Promise<File> {
  let source: ImageBitmap;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This file could not be read as an image. Use JPG, PNG or WebP.");
  }

  // Browsers without a WebP encoder silently return PNG; fall back to JPEG,
  // which needs a white background where the original was transparent.
  const probe = await toBlob(draw(source, 8 / Math.max(source.width, source.height)), "image/webp", 0.8);
  const type = probe.type === "image/webp" ? "image/webp" : "image/jpeg";

  let scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
  let result: Blob | null = null;

  for (let attempt = 0; attempt < 12 && !result; attempt++) {
    const canvas = draw(source, scale, type === "image/jpeg" ? "#ffffff" : undefined);
    const best = await toBlob(canvas, type, MAX_QUALITY);

    if (best.size <= TARGET_BYTES) {
      result = best;
      break;
    }

    const smallest = await toBlob(canvas, type, MIN_QUALITY);
    if (smallest.size > MAX_BYTES) {
      // Size follows pixel count roughly, so jump close to the target.
      scale *= Math.min(0.9, Math.sqrt(TARGET_BYTES / smallest.size));
      continue;
    }

    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    result = smallest;
    for (let i = 0; i < 6 && result.size < MIN_USEFUL_BYTES; i++) {
      const mid = (low + high) / 2;
      const blob = await toBlob(canvas, type, mid);
      if (blob.size <= TARGET_BYTES) {
        result = blob;
        low = mid;
      } else {
        high = mid;
      }
    }
  }
  source.close();

  if (!result) throw new Error("Could not compress this image enough. Try a smaller one.");

  const name = file.name.replace(/\.[^.]*$/, "") || "image";
  return new File([result], `${name}.${type === "image/webp" ? "webp" : "jpg"}`, { type });
}
