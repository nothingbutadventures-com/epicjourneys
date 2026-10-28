// Client-safe helpers for the optimized images we host. Each upload is stored twice:
//   tours/<hash>-1600.avif  (tour page)   and   tours/<hash>-640.avif  (cards and lists)
export const LARGE_SUFFIX = "-1600.avif";
export const SMALL_SUFFIX = "-640.avif";

/** The small version of one of our hosted images; any other URL (e.g. Unsplash) is returned unchanged. */
export function thumbUrl(url?: string | null): string {
  if (!url) return "";
  return url.endsWith(LARGE_SUFFIX) ? url.slice(0, -LARGE_SUFFIX.length) + SMALL_SUFFIX : url;
}

export const isHostedImage = (url?: string | null) => Boolean(url && url.endsWith(LARGE_SUFFIX));
