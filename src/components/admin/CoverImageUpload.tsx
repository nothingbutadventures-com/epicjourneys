"use client";

import React, { useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, LinearProgress, TextField, Typography } from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { isHostedImage, thumbUrl } from "@/lib/images";

const MAX_MB = 15;
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/** Cover photo for a tour: drop or choose a file and it is shrunk and stored, or paste an existing image URL. */
export default function CoverImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  // A photo uploaded in this session but not saved on the tour yet: safe to delete if it gets replaced.
  const unsaved = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const dropUnsaved = () => {
    const url = unsaved.current;
    unsaved.current = null;
    if (url) fetch("/api/uploads/tour-image", { method: "DELETE", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url }) }).catch(() => {});
  };

  const upload = async (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG, WebP or AVIF).");
    if (file.size > MAX_MB * 1048576) return setError(`That photo is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_MB} MB.`);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/tour-image", { method: "POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (res.status === 503) {
        setUseUrl(true);
        throw new Error(data.error);
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't upload the image");
      dropUnsaved();
      unsaved.current = data.data.url;
      onChange(data.data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = () => {
    dropUnsaved();
    onChange("");
  };

  const preview = isHostedImage(value) ? thumbUrl(value) : value;

  return (
    <Box>
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, mb: 0.75 }}>Cover image</Typography>
      {error && <Alert severity="warning" sx={{ mb: 1, borderRadius: "4px", py: 0 }} onClose={() => setError(null)}>{error}</Alert>}

      {value ? (
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", p: 1, border: "1px solid #e2e8f0", borderRadius: "4px" }}>
          <Box component="img" src={preview} alt="Cover preview" sx={{ width: 150, height: 96, objectFit: "cover", borderRadius: "4px", bgcolor: "#f1f5f9" }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => input.current?.click()} sx={{ textTransform: "none", borderColor: "#cbd5e1", color: "#0f172a" }}>Replace photo</Button>
              <Button size="small" color="error" disabled={busy} startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />} onClick={remove} sx={{ textTransform: "none" }}>Remove</Button>
            </Box>
          </Box>
          {busy && <CircularProgress size={22} />}
        </Box>
      ) : (
        <Box
          onClick={() => !busy && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
          sx={{ cursor: busy ? "default" : "pointer", p: 3, textAlign: "center", border: "2px dashed", borderColor: drag ? "#FF9900" : "#cbd5e1", bgcolor: drag ? "#FFF6E5" : "#fafafa", borderRadius: "4px" }}
        >
          {busy ? (
            <>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, mb: 1 }}>Uploading…</Typography>
              <LinearProgress sx={{ maxWidth: 260, mx: "auto", "& .MuiLinearProgress-bar": { bgcolor: "#FF9900" } }} />
            </>
          ) : (
            <>
              <CloudUploadRoundedIcon sx={{ color: "#94a3b8" }} />
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>Drop a photo here or click to choose</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>JPG, PNG, WebP or AVIF</Typography>
            </>
          )}
        </Box>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />

      <Button size="small" startIcon={<LinkRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setUseUrl((v) => !v)} sx={{ mt: 0.75, textTransform: "none", color: "#64748b", fontSize: "0.75rem" }}>
        {useUrl ? "Hide image URL" : "Or paste an image URL"}
      </Button>
      {useUrl && (
        <TextField fullWidth size="small" label="Image URL" value={value} onChange={(e) => { unsaved.current = null; onChange(e.target.value); }} placeholder="https://…" sx={{ mt: 0.5 }} />
      )}
    </Box>
  );
}
