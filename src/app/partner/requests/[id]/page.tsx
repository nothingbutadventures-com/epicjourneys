"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { LAUNCH_STATUS, totalDays, type LaunchStatus } from "@/lib/launch-shared";
import { DaysEditor, ItineraryPreview, MessageThread, SectionPaper, StatusChip, WorkflowStepper, authHeaders, fmtDate, inr } from "@/components/launch/LaunchParts";

const TOKEN = "epic_partner_token";

type Pending = { action: string; title: string; button: string; required?: boolean; danger?: boolean; help?: string } | null;

export default function PartnerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [launch, setLaunch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [pendingText, setPendingText] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/launches/${id}`, { headers: authHeaders(TOKEN) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Request not found");
      setLaunch(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/launches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(TOKEN) }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setLaunch(data.data);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (!pending) return;
    if (pending.required && !pendingText.trim()) return setError("Please write your message first.");
    if (await patch({ action: pending.action, text: pendingText })) {
      setPending(null);
      setPendingText("");
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={26} /></Box>;
  if (!launch) return <Alert severity="error" sx={{ borderRadius: "4px" }}>{error || "Request not found"}</Alert>;

  const tour = launch.tourId;
  const city = launch.cityId;
  const status: LaunchStatus = launch.status;
  const meta = LAUNCH_STATUS[status];
  const base = tour?.basePriceInr || 0;
  const hasPrice = launch.extraPriceInr !== null && launch.extraPriceInr !== undefined && status !== "submitted";
  const address = (city?.addresses || []).find((a: any) => String(a._id) === String(launch.addressId));
  const days = totalDays(tour.durationDays, launch.startItinerary.length, launch.endItinerary.length);
  const open = ["submitted", "awaiting_partner", "changes_requested", "partner_approved"].includes(status);

  return (
    <Box>
      <Button component={Link} href="/partner/requests" startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />} size="small" sx={{ color: "#64748b", mb: 1 }}>
        My requests
      </Button>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.25 }}>
          {tour.title} <Box component="span" sx={{ color: "#64748b", fontWeight: 500 }}>from {city?.name}</Box>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
          <StatusChip status={status} />
          <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{meta.hint} · revision {launch.revision}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}

      {status === "awaiting_partner" && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="contained" disabled={busy} onClick={() => setPending({ action: "agree", title: "Accept this plan", button: "Accept", help: "By accepting you agree to the dates, itinerary and price below. The admin then gives the final approval." })} sx={{ bgcolor: "#0f172a", borderRadius: "4px", "&:hover": { bgcolor: "#1e293b" } }}>Accept</Button>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => setPending({ action: "request_changes", title: "Ask for changes", button: "Send to admin", required: true, help: "Describe what you'd like changed:" })} sx={{ borderRadius: "4px" }}>Request changes</Button>
            </Box>
          }
        >
          The admin has reviewed your request and priced it. Please check the details and confirm — you can't edit them, but you can ask for changes.
        </Alert>
      )}
      {status === "partner_approved" && <Alert severity="success" sx={{ mb: 2, borderRadius: "4px" }}>You accepted this plan. It's now waiting for the admin's final approval.</Alert>}
      {status === "approved" && <Alert severity="success" sx={{ mb: 2, borderRadius: "4px" }}>Approved — these dates are live on the website for travellers from {city?.name}.</Alert>}
      {status === "rejected" && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>This request was rejected. See the messages for the reason.</Alert>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionPaper title="Dates & seats" caption={`${days} days per trip (${tour.durationDays} tour days + ${launch.startItinerary.length} start + ${launch.endItinerary.length} end)`}>
            {launch.specialOffer && (
              <Alert severity="info" sx={{ mb: 1.25, borderRadius: "4px", fontSize: "0.8rem" }}>
                <strong>{launch.specialOffer.name || "Special offer"}: {launch.specialOffer.percentage}% off</strong> is live for this tour until{" "}
                {new Date(launch.specialOffer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}. Customers get it on every date.
              </Alert>
            )}
            {launch.dates.map((d: any, i: number) => (
              <Box key={i} sx={{ display: "flex", gap: 2, py: 1, borderBottom: i < launch.dates.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, flex: 1, minWidth: 200 }}>{fmtDate(d.startDate)} – {fmtDate(d.endDate)}</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: "#475569" }}>{d.seats} seats</Typography>
                {(launch.specialOffer || d.discountPercentage > 0) && <Typography sx={{ fontSize: "0.82rem", color: "#dc2626" }}>{launch.specialOffer ? launch.specialOffer.percentage : d.discountPercentage}% off{launch.specialOffer ? " (special offer)" : ""}</Typography>}
              </Box>
            ))}
          </SectionPaper>

          <SectionPaper title="Price per person">
            {hasPrice ? (
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "baseline" }}>
                <Box><Typography variant="caption" sx={{ color: "#94a3b8" }}>Tour base price</Typography><Typography sx={{ fontWeight: 600 }}>{inr(base)}</Typography></Box>
                <Typography sx={{ color: "#94a3b8" }}>+</Typography>
                <Box><Typography variant="caption" sx={{ color: "#94a3b8" }}>{city?.name} supplement</Typography><Typography sx={{ fontWeight: 600 }}>{inr(launch.extraPriceInr)}</Typography></Box>
                <Typography sx={{ color: "#94a3b8" }}>=</Typography>
                <Box><Typography variant="caption" sx={{ color: "#94a3b8" }}>Travellers pay</Typography><Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>{inr(base + launch.extraPriceInr)}</Typography></Box>
              </Box>
            ) : (
              <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>The tour's base price is {inr(base)} per person. The admin sets the supplement for {city?.name} during review.</Typography>
            )}
          </SectionPaper>

          <SectionPaper title="Starting address">
            {address ? (
              <>
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{address.label}</Typography>
                <Typography sx={{ fontSize: "0.82rem", color: "#475569" }}>{address.address}{address.pincode ? ` — ${address.pincode}` : ""}</Typography>
              </>
            ) : <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8" }}>No address attached yet.</Typography>}
          </SectionPaper>

          {(launch.startNotes?.length > 0 || launch.endNotes?.length > 0) && (
            <SectionPaper title="Your notes for extra days" caption="The admin turns these into itinerary days.">
              {[["Before the tour", launch.startNotes], ["After the tour", launch.endNotes]].map(
                ([label, list]: any) =>
                  list?.length > 0 && (
                    <Box key={label} sx={{ mb: 1.25 }}>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>{label}</Typography>
                      {list.map((n: string, i: number) => (
                        <Typography key={i} sx={{ fontSize: "0.85rem", whiteSpace: "pre-line" }}>{i + 1}. {n}</Typography>
                      ))}
                    </Box>
                  )
              )}
            </SectionPaper>
          )}

          <SectionPaper title="City itinerary">
            <DaysEditor title="Start itinerary" hint="Days before the main tour" days={launch.startItinerary} onChange={() => {}} readOnly />
            <Divider sx={{ my: 2 }} />
            <DaysEditor title="End itinerary" hint="Days after the main tour" days={launch.endItinerary} onChange={() => {}} readOnly />
          </SectionPaper>

          <SectionPaper title={`What travellers will see (${days} days)`}>
            <ItineraryPreview main={tour.itinerary || []} start={launch.startItinerary} end={launch.endItinerary} />
          </SectionPaper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: { md: "sticky" }, top: 80 }}>
            <SectionPaper title="Progress">
              <WorkflowStepper status={status} />
              {open && (
                <Button fullWidth size="small" color="error" disabled={busy} onClick={() => setPending({ action: "withdraw", title: "Withdraw request", button: "Withdraw", danger: true, help: "This cancels the request. You can send a new one later." })} sx={{ mt: 2, borderRadius: "4px" }}>
                  Withdraw request
                </Button>
              )}
            </SectionPaper>
            <SectionPaper title="Messages">
              <TextField fullWidth multiline minRows={2} size="small" placeholder="Write to the admin…" value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button size="small" sx={{ mt: 0.75, color: "#0f172a" }} disabled={busy || !message.trim()} onClick={async () => (await patch({ action: "message", text: message })) && setMessage("")}>
                Send message
              </Button>
              <Divider sx={{ my: 1.5 }} />
              <MessageThread messages={launch.messages} />
            </SectionPaper>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={Boolean(pending)} onClose={() => !busy && setPending(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>{pending?.title}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {pending?.help && <Typography sx={{ fontSize: "0.82rem", color: "#475569", mb: 1.5 }}>{pending.help}</Typography>}
          <TextField fullWidth multiline minRows={3} size="small" label={pending?.required ? "Message (required)" : "Note (optional)"} value={pendingText} onChange={(e) => setPendingText(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setPending(null)} disabled={busy} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={run} color={pending?.danger ? "error" : "primary"} sx={pending?.danger ? undefined : { bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {busy ? "Working…" : pending?.button}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
