"use client";

import React from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { LAUNCH_STATUS, LAUNCH_STEPS, launchStep, type DayInput, type LaunchStatus } from "@/lib/launch-shared";

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export function authHeaders(tokenKey: string): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function StatusChip({ status }: { status: LaunchStatus }) {
  const m = LAUNCH_STATUS[status] || LAUNCH_STATUS.submitted;
  return <Chip label={m.label} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: m.bg, color: m.fg }} />;
}

/** Four-step progress: partner request → admin review → partner confirmation → approved. */
export function WorkflowStepper({ status }: { status: LaunchStatus }) {
  const active = launchStep(status);
  const stopped = status === "rejected" || status === "withdrawn";
  return (
    <Stepper activeStep={stopped ? 0 : active} alternativeLabel sx={{ "& .MuiStepLabel-label": { fontSize: "0.72rem" } }}>
      {LAUNCH_STEPS.map((l, i) => (
        <Step key={l} completed={!stopped && i < active}>
          <StepLabel error={stopped && i === 0}>{l}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

/** Editor for the extra itinerary days a city adds before / after the main tour. */
export function DaysEditor({
  title,
  hint,
  days,
  onChange,
  readOnly,
  startNumber = 1,
}: {
  title: string;
  hint: string;
  days: DayInput[];
  onChange: (d: DayInput[]) => void;
  readOnly?: boolean;
  startNumber?: number;
}) {
  const set = (i: number, patch: Partial<DayInput>) => onChange(days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>{hint}</Typography>
        </Box>
        {!readOnly && (
          <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => onChange([...days, { title: "", description: "", meals: "", stay: "" }])} sx={{ borderRadius: "4px" }}>
            Add day
          </Button>
        )}
      </Box>
      {days.length === 0 && <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", py: 0.5 }}>None added.</Typography>}
      {days.map((d, i) => (
        <Box key={i} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 1.5, mb: 1.25, bgcolor: "#fff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {title.toLowerCase().includes("start") ? `Day ${startNumber + i}` : `Extra day ${i + 1}`}
            </Typography>
            {!readOnly && (
              <IconButton size="small" aria-label="Remove day" onClick={() => onChange(days.filter((_, j) => j !== i))} sx={{ color: "#dc2626", p: 0.5 }}>
                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          {readOnly ? (
            <>
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{d.title}</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "#475569", whiteSpace: "pre-line" }}>{d.description}</Typography>
              {(d.meals || d.stay) && (
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.5 }}>
                  {[d.meals && `Meals: ${d.meals}`, d.stay && `Stay: ${d.stay}`].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </>
          ) : (
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Title" fullWidth required value={d.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="e.g. Travel from Pune to Mumbai" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Details" fullWidth multiline minRows={2} value={d.description || ""} onChange={(e) => set(i, { description: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Meals" fullWidth value={d.meals || ""} onChange={(e) => set(i, { meals: e.target.value })} placeholder="Dinner" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Stay" fullWidth value={d.stay || ""} onChange={(e) => set(i, { stay: e.target.value })} placeholder="Hotel / overnight train" />
              </Grid>
            </Grid>
          )}
        </Box>
      ))}
    </Box>
  );
}

const KIND_LABEL: Record<string, string> = {
  request: "submitted the request",
  message: "wrote",
  sent: "sent it to the partner",
  changes: "asked for changes",
  agreed: "agreed to the plan",
  approved: "gave final approval",
  rejected: "rejected the request",
  recalled: "recalled it for editing",
  withdrawn: "withdrew the request",
  closed: "took it offline",
};

export function MessageThread({ messages }: { messages: any[] }) {
  if (!messages?.length) return <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>No activity yet.</Typography>;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {[...messages].reverse().map((m, i) => (
        <Box key={i} sx={{ borderLeft: "3px solid", borderColor: m.by === "admin" ? "#0f172a" : m.by === "partner" ? "#facc15" : "#cbd5e1", pl: 1.25 }}>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
            {m.name || (m.by === "admin" ? "Admin" : "Partner")}{" "}
            <Box component="span" sx={{ fontWeight: 400, color: "#64748b" }}>{KIND_LABEL[m.kind] || m.kind}</Box>
          </Typography>
          {m.text && <Typography sx={{ fontSize: "0.82rem", color: "#334155", whiteSpace: "pre-line", mt: 0.25 }}>{m.text}</Typography>}
          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{fmtDateTime(m.at)}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function SectionPaper({ title, caption, children, action }: { title: string; caption?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Box sx={{ p: 2.25, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.75, gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>{title}</Typography>
          {caption && <Typography variant="caption" sx={{ color: "#64748b" }}>{caption}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

/** Main itinerary with the city's start and end days attached. */
export function ItineraryPreview({ main, start, end }: { main: any[]; start: DayInput[]; end: DayInput[] }) {
  let n = 0;
  const rows = [
    ...start.map((d) => ({ ...d, seg: "start" })),
    ...main.map((d) => ({ ...d, seg: "main" })),
    ...end.map((d) => ({ ...d, seg: "end" })),
  ];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {rows.map((d, i) => (
        <Box key={i} sx={{ display: "flex", gap: 1.25, alignItems: "baseline" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", minWidth: 44 }}>Day {++n}</Typography>
          <Typography sx={{ fontSize: "0.82rem", flex: 1 }}>{d.title}</Typography>
          <Chip label={d.seg === "main" ? "Tour" : d.seg === "start" ? "City start" : "City end"} size="small" sx={{ height: 18, fontSize: "0.62rem", borderRadius: "4px", bgcolor: d.seg === "main" ? "#f1f5f9" : "#fef9c3", color: d.seg === "main" ? "#475569" : "#854d0e" }} />
        </Box>
      ))}
    </Box>
  );
}
