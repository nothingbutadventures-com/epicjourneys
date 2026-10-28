"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";

// Catches a failed navigation or render so the page never just sits there: stale chunks (after a rebuild or a
// long idle session) reload once automatically, anything else offers a retry.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported|Importing a module script failed|error loading dynamically/i.test(`${error.name} ${error.message}`);

  useEffect(() => {
    if (!stale) return;
    try {
      if (sessionStorage.getItem("ej_chunk_reload") === "1") return;
      sessionStorage.setItem("ej_chunk_reload", "1");
    } catch {}
    window.location.reload();
  }, [stale]);

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", p: 3 }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 1 }}>{stale ? "Updating the page…" : "Something went wrong"}</Typography>
      <Typography sx={{ color: "#64748b", mb: 3, maxWidth: 420 }}>
        {stale ? "A newer version is available. Reloading." : "The page couldn't load. You can try again — your data is safe."}
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button variant="contained" onClick={() => reset()} sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}>Try again</Button>
        <Button variant="outlined" onClick={() => window.location.reload()} sx={{ color: "#0f172a", borderColor: "#cbd5e1" }}>Reload page</Button>
      </Box>
    </Box>
  );
}
