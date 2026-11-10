import fs from "fs";
import path from "path";

/** Serves one of the static design pages (design/*.html) with absolute asset paths and live data injected as window.EJ_LIVE. */
export function designPage(file: string, live: unknown = {}): Response {
  let html = fs.readFileSync(path.join(process.cwd(), "design", file), "utf8");
  html = html
    .replace(/(href|src)="(css|js|img|video)\//g, '$1="/$2/')
    .replace(/url\((["']?)(img)\//g, "url($1/$2/")
    .replace(/href="index\.html#/g, 'href="/#')
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/href="partners\.html/g, 'href="/become-a-partner')
    .replace(/href="tour\.html\?t=/g, 'href="/tours/');
  const json = JSON.stringify(live).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16));
  html = html.replace(/<script src="\/js\/data\.js/, `<script>window.EJ_LIVE=${json}</script>\n<script src="/js/data.js`);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
