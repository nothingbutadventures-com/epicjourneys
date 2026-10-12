/** Only allow same-site relative paths as post-login destinations (blocks open redirects). */
export function safeRedirect(path: string | null | undefined, fallback = "/") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}

/** Appends ?redirect=<path> to an auth URL when there is somewhere to return to. */
export function withRedirect(url: string, redirect: string | null | undefined) {
  const r = safeRedirect(redirect, "");
  if (!r) return url;
  return `${url}${url.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(r)}`;
}
