"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { LAUNCH_STATUS, endDateFor, totalDays, type DayInput, type LaunchStatus } from "@/lib/launch-shared";
import {
  DaysEditor,
  ItineraryPreview,
  MessageThread,
  SectionPaper,
  StatusChip,
  WorkflowStepper,
  authHeaders,
  fmtDate,
  inr,
} from "@/components/launch/LaunchParts";

const TOKEN = "epic_token";

interface DateRow {
  startDate: string;
  seats: number | "";
  discountPercentage: number;
}

type PendingAction = { action: string; title: string; button: string; required?: boolean; danger?: boolean; help?: string } | null;

export default function AdminLaunchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [launch, setLaunch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  // editable form
  const [dates, setDates] = useState<DateRow[]>([]);
  const [startDays, setStartDays] = useState<DayInput[]>([]);
  const [endDays, setEndDays] = useState<DayInput[]>([]);
  const [addressId, setAddressId] = useState("");
  const [partnerNotes, setPartnerNotes] = useState("");
  const [extra, setExtra] = useState<string>("");

  const [discounts, setDiscounts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingAction>(null);
  const [pendingText, setPendingText] = useState("");

  const hydrate = useCallback((l: any) => {
    setLaunch(l);
    setDates((l.dates || []).map((d: any) => ({ startDate: String(d.startDate).slice(0, 10), seats: d.seats, discountPercentage: d.discountPercentage || 0 })));
    setStartDays(l.startItinerary || []);
    setEndDays(l.endItinerary || []);
    setAddressId(l.addressId ? String(l.addressId) : "");
    setPartnerNotes(l.partnerNotes || "");
    setExtra(l.extraPriceInr === null || l.extraPriceInr === undefined ? "" : String(l.extraPriceInr));
    setDirty(false);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/launches/${id}`, { headers: authHeaders(TOKEN) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Request not found");
      hydrate(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, hydrate]);

  useEffect(() => {
    load();
    fetch("/api/discounts")
      .then((r) => r.json())
      .then((d) => d.success && setDiscounts(d.data || []))
      .catch(() => {});
  }, [load]);

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const patch = async (payload: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/launches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(TOKEN) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      hydrate(data.data);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    patch({
      action: "update",
      dates: dates.map((d) => ({ ...d, seats: Number(d.seats) })),
      startItinerary: startDays,
      endItinerary: endDays,
      addressId: addressId || null,
      partnerNotes,
      extraPriceInr: extra === "" ? null : Number(extra),
    });

  const runPending = async () => {
    if (!pending) return;
    if (pending.required && !pendingText.trim()) return setError("Please add a note first.");
    // Edits must be saved before the request moves on.
    if (dirty && ["send"].includes(pending.action)) {
      const ok = await save();
      if (!ok) return setPending(null);
    }
    const ok = await patch({ action: pending.action, text: pendingText });
    if (ok) {
      setPending(null);
      setPendingText("");
    }
  };

  const tour = launch?.tourId;
  const city = launch?.cityId;
  const partner = launch?.partnerId;
  const status: LaunchStatus | undefined = launch?.status;
  const editable = status === "submitted" || status === "changes_requested";

  const addresses: any[] = city?.addresses || [];
  const base = tour?.basePriceInr || 0;
  const extraNum = extra === "" ? null : Number(extra);
  const finalPrice = extraNum === null || isNaN(extraNum) ? null : base + extraNum;
  const daysPerTrip = useMemo(() => (tour ? totalDays(tour.durationDays, startDays.length, endDays.length) : 0), [tour, startDays, endDays]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={26} /></Box>;
  if (!launch) return <Alert severity="error" sx={{ borderRadius: "4px" }}>{error || "Request not found"}</Alert>;

  const meta = LAUNCH_STATUS[status!];

  return (
    <Box>
      <Button component={Link} href="/admin/launches" startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />} size="small" sx={{ color: "#64748b", mb: 1 }}>
        All partner requests
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.25 }}>
            {tour?.title} <Box component="span" sx={{ color: "#64748b", fontWeight: 500 }}>from {city?.name}</Box>
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
            <StatusChip status={launch.status} />
            <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{meta.hint} · revision {launch.revision}</Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!editable && ["awaiting_partner", "partner_approved"].includes(launch.status) && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "4px" }}>
          This request is with the partner{launch.status === "partner_approved" ? " (they agreed)" : ""}. To change anything, recall it first.
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {/* Left: editable details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionPaper title="Request">
            <Grid container spacing={1.5}>
              {[
                ["Tour", tour?.title],
                ["Start & end city", `${city?.name}, ${city?.state}`],
                ["Partner", partner ? `${partner.name}${partner.companyName ? ` (${partner.companyName})` : ""}` : "—"],
                ["Partner contact", partner ? [partner.phone, partner.secondaryPhone, partner.email].filter(Boolean).join(" · ") : "—"],
              ].map(([l, v]) => (
                <Grid size={{ xs: 12, sm: 6 }} key={l as string}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", wordBreak: "break-word" }}>{v}</Typography>
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <TextField label="Partner's notes" fullWidth multiline minRows={2} value={partnerNotes} disabled={!editable} onChange={(e) => touch(setPartnerNotes)(e.target.value)} />
              </Grid>
            </Grid>
          </SectionPaper>

          <SectionPaper
            title="Dates & seats"
            caption={`End dates are set automatically: ${tour?.durationDays} tour days + ${startDays.length} start + ${endDays.length} end = ${daysPerTrip} days.`}
            action={editable && (
              <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => touch(setDates)([...dates, { startDate: "", seats: tour?.maxGroupSize || 15, discountPercentage: 0 }])} sx={{ borderRadius: "4px" }}>
                Add date
              </Button>
            )}
          >
            {dates.length === 0 && <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>No dates yet.</Typography>}
            {dates.map((d, i) => {
              const end = d.startDate ? endDateFor(d.startDate, tour.durationDays, startDays.length, endDays.length) : "";
              const set = (patchRow: Partial<DateRow>) => touch(setDates)(dates.map((x, j) => (j === i ? { ...x, ...patchRow } : x)));
              return (
                <Box key={i} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 1.5, mb: 1.25 }}>
                  <Grid container spacing={1.25} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField label="Start date" type="date" fullWidth size="small" disabled={!editable} value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField label="End date (auto)" fullWidth size="small" disabled value={end ? fmtDate(end) : "—"} />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField label="Seats" type="number" fullWidth size="small" disabled={!editable} value={d.seats} onChange={(e) => set({ seats: e.target.value === "" ? "" : Number(e.target.value) })} slotProps={{ htmlInput: { min: 1 } }} />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <FormControl fullWidth size="small" disabled={!editable}>
                        <InputLabel>Discount</InputLabel>
                        <Select value={d.discountPercentage} label="Discount" onChange={(e) => set({ discountPercentage: Number(e.target.value) })}>
                          <MenuItem value={0}>No Discount (0%)</MenuItem>
                          {discounts.map((disc) => (
                            <MenuItem key={disc._id} value={disc.value}>{disc.name} ({disc.value}% OFF)</MenuItem>
                          ))}
                          {d.discountPercentage > 0 && !discounts.some((x) => x.value === d.discountPercentage) && (
                            <MenuItem value={d.discountPercentage}>Custom ({d.discountPercentage}% OFF)</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }} sx={{ textAlign: "right" }}>
                      {editable && (
                        <IconButton size="small" aria-label="Remove date" onClick={() => touch(setDates)(dates.filter((_, j) => j !== i))} sx={{ color: "#dc2626" }}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              );
            })}
          </SectionPaper>

          <SectionPaper title="Pricing" caption="The tour's base price plus the supplement for this city. Travellers see the total.">
            <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Base price (per person)" fullWidth size="small" disabled value={inr(base)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Extra price for this city (₹)" type="number" required fullWidth size="small" disabled={!editable} value={extra} onChange={(e) => touch(setExtra)(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} helperText="Use 0 for no supplement" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>Price per person</Typography>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: 700 }}>{finalPrice === null ? "—" : inr(finalPrice)}</Typography>
              </Grid>
            </Grid>
          </SectionPaper>

          <SectionPaper title="Starting address" caption="Where travellers report on departure day (from the city's address book).">
            <FormControl fullWidth size="small" disabled={!editable || addresses.length === 0}>
              <InputLabel>Starting address</InputLabel>
              <Select value={addressId} label="Starting address" onChange={(e) => touch(setAddressId)(e.target.value as string)}>
                <MenuItem value=""><em>No address selected</em></MenuItem>
                {addresses.map((a) => <MenuItem key={a._id} value={a._id}>{a.label} — {a.address}</MenuItem>)}
              </Select>
            </FormControl>
            {addresses.length === 0 && <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>{city?.name} has no addresses yet — add them under Destinations.</Typography>}
          </SectionPaper>

          {(launch.startNotes?.length > 0 || launch.endNotes?.length > 0) && (
            <SectionPaper title="Partner's ideas for extra days" caption="Notes from the partner — turn them into itinerary days below.">
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

          <SectionPaper title="City itinerary" caption="Days this city adds before and after the main tour (e.g. travel to the tour's starting point).">
            <DaysEditor title="Start itinerary" hint="Days before the main itinerary begins" days={startDays} onChange={touch(setStartDays)} readOnly={!editable} />
            <Divider sx={{ my: 2 }} />
            <DaysEditor title="End itinerary" hint="Days after the main itinerary ends (return journey)" days={endDays} onChange={touch(setEndDays)} readOnly={!editable} />
          </SectionPaper>

          <SectionPaper title={`What travellers will see (${daysPerTrip} days)`}>
            <ItineraryPreview main={tour?.itinerary || []} start={startDays} end={endDays} />
          </SectionPaper>
        </Grid>

        {/* Right: workflow */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: { md: "sticky" }, top: 80 }}>
            <SectionPaper title="Workflow">
              <WorkflowStepper status={launch.status} />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {editable && (
                  <>
                    <Button variant="outlined" size="small" disabled={busy || !dirty} onClick={save} sx={{ borderRadius: "4px" }}>
                      {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
                    </Button>
                    <Button variant="contained" size="small" disabled={busy} onClick={() => setPending({ action: "send", title: "Send to partner for confirmation", button: "Send to partner", help: "The partner can approve it or ask for changes. Optional note:" })} sx={{ bgcolor: "#0f172a", borderRadius: "4px", "&:hover": { bgcolor: "#1e293b" } }}>
                      Send to partner
                    </Button>
                  </>
                )}
                {(launch.status === "awaiting_partner" || launch.status === "partner_approved") && (
                  <Button variant="outlined" size="small" disabled={busy} onClick={() => setPending({ action: "recall", title: "Recall for editing", button: "Recall", help: "Pulls it back to you so you can edit. Optional note for the partner:" })} sx={{ borderRadius: "4px" }}>
                    Recall to edit
                  </Button>
                )}
                {launch.status === "partner_approved" && (
                  <Button variant="contained" size="small" disabled={busy} onClick={() => setPending({ action: "approve", title: "Final approval", button: "Approve & publish", help: `Publishes ${launch.dates.length} date${launch.dates.length === 1 ? "" : "s"} from ${city?.name} on the website at ${finalPrice === null ? "—" : inr(finalPrice)} per person.` })} sx={{ bgcolor: "#059669", borderRadius: "4px", "&:hover": { bgcolor: "#047857" } }}>
                    Approve & publish
                  </Button>
                )}
                {launch.status === "approved" && (
                  <Button variant="outlined" color="error" size="small" disabled={busy} onClick={() => setPending({ action: "close", title: "Take offline", button: "Take offline", danger: true, help: "Removes these dates from the website. Not possible once travellers have booked." })} sx={{ borderRadius: "4px" }}>
                    Take offline
                  </Button>
                )}
                {["submitted", "awaiting_partner", "changes_requested", "partner_approved"].includes(launch.status) && (
                  <Button color="error" size="small" disabled={busy} onClick={() => setPending({ action: "reject", title: "Reject request", button: "Reject", required: true, danger: true, help: "Tell the partner why:" })} sx={{ borderRadius: "4px" }}>
                    Reject
                  </Button>
                )}
              </Box>
            </SectionPaper>

            <SectionPaper title="Messages">
              <TextField fullWidth multiline minRows={2} size="small" placeholder="Write to the partner…" value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button size="small" sx={{ mt: 0.75, color: "#0f172a" }} disabled={busy || !message.trim()} onClick={async () => (await patch({ action: "message", text: message })) && setMessage("")}>
                Post message
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
          <TextField fullWidth multiline minRows={3} size="small" label={pending?.required ? "Reason (required)" : "Note (optional)"} value={pendingText} onChange={(e) => setPendingText(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setPending(null)} disabled={busy} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={runPending} color={pending?.danger ? "error" : "primary"} sx={pending?.danger ? undefined : { bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {busy ? "Working…" : pending?.button}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
