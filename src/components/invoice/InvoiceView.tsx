"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import type { Invoice } from "@/lib/invoice";

const inr = (n: number) => `${n < 0 ? "− " : ""}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const STATUS: Record<string, [string, string, string]> = {
  paid: ["Paid", "#ecfdf5", "#047857"],
  partial: ["Partly paid", "#fffbeb", "#b45309"],
  pending: ["Payment pending", "#fffbeb", "#b45309"],
  cancelled: ["Cancelled", "#fef2f2", "#dc2626"],
};

/** The booking invoice, same content as the PDF and the email. `tokenKey` is the localStorage key for partner logins. */
export default function InvoiceView({ bookingRef, tokenKey }: { bookingRef: string; tokenKey?: string }) {
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = (): Record<string, string> => {
    const t = tokenKey && typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    fetch(`/api/invoice?ref=${encodeURIComponent(bookingRef)}`, { headers: headers() })
      .then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json() }))
      .then(({ ok, status, data }) => (ok && data.success ? setInv(data.data) : setError(status === 401 ? "Please log in to view this invoice." : data.error || "Invoice not found")))
      .catch(() => setError("Couldn't load the invoice"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingRef]);

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/invoice?ref=${encodeURIComponent(bookingRef)}&format=pdf`, { headers: headers() });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv?.number || "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (error && !inv) return <Alert severity="error">{error}</Alert>;
  if (!inv) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#0f172a" }} /></Box>;
  const [sl, sbg, sfg] = STATUS[inv.status];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 1.5, "@media print": { display: "none" } }}>
        <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => window.print()} sx={{ color: "#0f172a", borderColor: "#cbd5e1" }}>Print</Button>
        <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />} disabled={busy} onClick={download} sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}>
          Download PDF
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid #E2E2E2", bgcolor: "#fff", overflow: "hidden", "@media print": { border: 0 } }}>
        <Box sx={{ bgcolor: "#FFF3DB", borderBottom: "4px solid #FF9900", p: { xs: 2.5, md: 3.5 }, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box component="img" src="/logo.svg" alt="EpicJourneys" sx={{ height: 56, width: "auto" }} />
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.02em", lineHeight: 1 }}>INVOICE</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mt: 0.5 }}>{inv.number}</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>Issued {fmt(inv.issuedAt)}</Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 3, flexWrap: "wrap", mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8" }}>BILLED TO</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{inv.customer.name}</Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>{inv.customer.email}</Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>+91 {inv.customer.phone}</Typography>
            </Box>
            <Box sx={{ textAlign: { sm: "right" } }}>
              <Chip label={sl} sx={{ bgcolor: sbg, color: sfg, fontWeight: 800, borderRadius: "4px" }} />
              <Typography sx={{ color: "#64748b", fontSize: "0.82rem", mt: 1 }}>Booking reference</Typography>
              <Typography sx={{ fontWeight: 700 }}>{inv.bookingRef}</Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, bgcolor: "#FAFAFA", border: "1px solid #E2E2E2", mb: 3 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8" }}>TOUR</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{inv.tour.title}</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>
              {fmt(inv.tour.start)}{inv.tour.end ? ` – ${fmt(inv.tour.end)}` : ""}{inv.tour.city ? ` · Starts from ${inv.tour.city}` : ""}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8", mb: 1 }}>TRAVELLERS</Typography>
          <Box sx={{ mb: 3 }}>
            {inv.travellers.map((t, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderBottom: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{i + 1}. {t.name}</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>{t.age ? `Age ${t.age}` : ""}{t.phone ? ` · +91 ${t.phone}` : ""} · {t.room}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ border: "1px solid #E2E2E2", mb: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "#0f172a", color: "#fff", px: 2, py: 1 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em" }}>DESCRIPTION</Typography>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em" }}>AMOUNT</Typography>
            </Box>
            {inv.lines.map((l, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: "1px solid #F1F5F9" }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>{l.label}</Typography>
                  {l.detail && <Typography sx={{ color: "#64748b", fontSize: "0.78rem" }}>{l.detail}</Typography>}
                </Box>
                <Typography sx={{ fontWeight: 700, color: l.amount < 0 ? "#c2410c" : "#0f172a" }}>{inr(l.amount)}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Box sx={{ minWidth: 260, p: 2, bgcolor: "#FFF3DB", border: "1px solid #FF9900" }}>
              {[["Total", inr(inv.total), "#0f172a", 800], ["Paid", inr(inv.paid), "#047857", 600], ["Balance due", inr(inv.balance), "#0f172a", 800]].map(([l, v, c, w]) => (
                <Box key={l as string} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                  <Typography sx={{ fontWeight: w as number, fontSize: "0.92rem", color: c as string }}>{l}</Typography>
                  <Typography sx={{ fontWeight: w as number, fontSize: "0.95rem", color: c as string }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {inv.payments.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8", mb: 1 }}>PAYMENTS</Typography>
              {inv.payments.map((p, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderBottom: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{p.label}</Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: p.status === "paid" ? "#047857" : "#64748b" }}>{p.status === "paid" ? `Paid on ${fmt(p.date)}` : `Due ${fmt(p.due)}`}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{inr(p.amount)}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {inv.specialRequests && (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8" }}>SPECIAL REQUESTS</Typography>
              <Typography sx={{ fontSize: "0.9rem", whiteSpace: "pre-line" }}>{inv.specialRequests}</Typography>
            </Box>
          )}
          {inv.partner?.name && (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8" }}>BOOKED BY YOUR LOCAL PARTNER</Typography>
              <Typography sx={{ fontSize: "0.9rem" }}>{inv.partner.name}{inv.partner.phone ? ` · +91 ${inv.partner.phone}` : ""}{inv.partner.email ? ` · ${inv.partner.email}` : ""}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #E2E2E2", px: { xs: 2.5, md: 3.5 }, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>EpicJourneys · epicjourneys.in</Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>This is a computer-generated invoice and does not require a signature.</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
