import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { LARGE_SUFFIX, SMALL_SUFFIX } from "@/lib/images";

// Server-only: uses the service key, which must never reach the browser.
const URL_ENV = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const BUCKET = process.env.SUPABASE_BUCKET || "cover-images";

export const storageConfigured = () => Boolean(URL_ENV && KEY);

let client: SupabaseClient | null = null;
function supabase() {
  if (!storageConfigured()) throw new Error("Image storage isn't configured yet.");
  return (client ||= createClient(URL_ENV, KEY, { auth: { persistSession: false, autoRefreshToken: false } }));
}

const publicBase = () => `${URL_ENV.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;

export const publicUrl = (path: string) => `${publicBase()}${path}`;

/** Our object path for one of our public URLs, or null for anything we didn't host (so we never delete foreign files). */
export function pathFromUrl(url: string): string | null {
  if (!storageConfigured() || !url.startsWith(publicBase())) return null;
  const p = url.slice(publicBase().length).split("?")[0];
  return /^tours\/[0-9a-f]{16,64}-1600\.avif$/.test(p) ? p : null;
}

export async function uploadObject(path: string, data: Buffer, contentType: string) {
  const { error } = await supabase().storage.from(BUCKET).upload(path, data, {
    contentType,
    cacheControl: "31536000", // content-hashed names never change, so browsers and the CDN can keep them for a year
    upsert: false,
  });
  // The same photo uploaded twice has the same name: that's a success, not an error.
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

/** Removes both stored sizes of an image we hosted. */
export async function deleteHostedImage(url: string) {
  const large = pathFromUrl(url);
  if (!large) return;
  const small = large.slice(0, -LARGE_SUFFIX.length) + SMALL_SUFFIX;
  const { error } = await supabase().storage.from(BUCKET).remove([large, small]);
  if (error) console.error("image delete failed", error.message);
}
