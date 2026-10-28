"use client";

import { useEffect } from "react";

// Last-resort boundary for errors in the root layout itself.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported/i.test(`${error.name} ${error.message}`)) {
      try {
        if (sessionStorage.getItem("ej_chunk_reload") === "1") return;
        sessionStorage.setItem("ej_chunk_reload", "1");
      } catch {}
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", margin: 0 }}>
        <div>
          <h2>Something went wrong</h2>
          <p style={{ color: "#64748b" }}>Please try again.</p>
          <button onClick={() => reset()} style={{ padding: "10px 20px", background: "#FF9900", border: 0, fontWeight: 700, cursor: "pointer" }}>Try again</button>{" "}
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
