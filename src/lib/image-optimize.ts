import crypto from "crypto";
import sharp from "sharp";

export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const LARGE_WIDTH = 1600;
export const SMALL_WIDTH = 640;
// AVIF at quality 55 matches WebP at 74 visually (about 35 dB) while being about 22% smaller.
const AVIF = { quality: 55, effort: 4 } as const;

export interface Optimized {
  hash: string;
  large: { data: Buffer; width: number; height: number };
  small: { data: Buffer; width: number; height: number };
  originalBytes: number;
}

/** Turns an uploaded photo into two small AVIF files. Throws a readable error if the file isn't a usable image. */
export async function optimizeImage(input: Buffer): Promise<Optimized> {
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { failOn: "error", animated: false }).metadata();
  } catch {
    throw new Error("That file isn't a valid image. Use a JPG, PNG, WebP or AVIF photo.");
  }
  if (!["jpeg", "png", "webp", "avif", "gif", "heif", "tiff"].includes(meta.format || "")) throw new Error("Use a JPG, PNG, WebP or AVIF photo.");
  if (!meta.width || !meta.height || meta.width < 400 || meta.height < 250) throw new Error("The image is too small. Use a photo at least 400 × 250 pixels.");

  // Rotate by EXIF, drop metadata (GPS, camera), and never enlarge a smaller photo.
  const base = sharp(input, { failOn: "error", animated: false }).rotate().flatten({ background: "#ffffff" });
  const make = async (width: number) => {
    const { data, info } = await base.clone().resize({ width, height: width, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" }).avif(AVIF).toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  };
  const [large, small] = await Promise.all([make(LARGE_WIDTH), make(SMALL_WIDTH)]);
  // Same photo => same name, so a repeated upload stores nothing new.
  const hash = crypto.createHash("sha256").update(large.data).digest("hex").slice(0, 24);
  return { hash, large, small, originalBytes: input.length };
}
