// Shared (client + server) helpers for the "launch a tour from a city" workflow.

export type LaunchStatus =
  | "submitted"
  | "awaiting_partner"
  | "changes_requested"
  | "partner_approved"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "closed";

export interface DayInput {
  title: string;
  description?: string;
  meals?: string;
  stay?: string;
}

/** Who has to act next, plus colours/labels for chips. */
export const LAUNCH_STATUS: Record<LaunchStatus, { label: string; waiting: "admin" | "partner" | "none"; bg: string; fg: string; hint: string }> = {
  submitted: { label: "New request", waiting: "admin", bg: "#eff6ff", fg: "#2563eb", hint: "Waiting for admin review" },
  awaiting_partner: { label: "Awaiting partner", waiting: "partner", bg: "#fffbeb", fg: "#d97706", hint: "Admin sent it back — the partner needs to confirm" },
  changes_requested: { label: "Changes requested", waiting: "admin", bg: "#fff7ed", fg: "#ea580c", hint: "Partner asked for changes — admin to revise" },
  partner_approved: { label: "Partner agreed", waiting: "admin", bg: "#f0fdf4", fg: "#16a34a", hint: "Partner agreed — ready for final approval" },
  approved: { label: "Live", waiting: "none", bg: "#ecfdf5", fg: "#059669", hint: "Dates are live on the website" },
  rejected: { label: "Rejected", waiting: "none", bg: "#fef2f2", fg: "#dc2626", hint: "Rejected by admin" },
  withdrawn: { label: "Withdrawn", waiting: "none", bg: "#f1f5f9", fg: "#64748b", hint: "Withdrawn by the partner" },
  closed: { label: "Closed", waiting: "none", bg: "#f1f5f9", fg: "#64748b", hint: "Taken offline" },
};

export const LAUNCH_STEPS = ["Partner request", "Admin review", "Partner confirmation", "Approved"] as const;

/** Which of the four workflow steps a status is currently on (0-based). */
export function launchStep(status: LaunchStatus): number {
  switch (status) {
    case "submitted":
    case "changes_requested":
      return 1;
    case "awaiting_partner":
      return 2;
    case "partner_approved":
      return 3;
    case "approved":
    case "closed":
      return 4;
    default:
      return 0;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Total trip length for a city: partner's start days + the tour's main itinerary + end days. */
export function totalDays(mainDays: number, startDays: number, endDays: number) {
  return Math.max(1, (Number(mainDays) || 1) + startDays + endDays);
}

/** End date (YYYY-MM-DD) decided by the itinerary, not typed in. */
export function endDateFor(startYmd: string, mainDays: number, startDays: number, endDays: number) {
  const start = new Date(`${startYmd}T00:00:00.000Z`);
  if (isNaN(start.getTime())) return "";
  return new Date(start.getTime() + (totalDays(mainDays, startDays, endDays) - 1) * DAY_MS).toISOString().slice(0, 10);
}

/** Main itinerary with the city's start / end days attached and every day renumbered. */
export function combinedItinerary(main: any[] = [], start: DayInput[] = [], end: DayInput[] = []) {
  let n = 0;
  const num = <T extends object>(d: T, extra: Record<string, unknown>) => ({ ...d, ...extra, day: ++n });
  return [
    ...start.map((d) => num(d, { segment: "start" })),
    ...main.map((d) => num(d, { segment: "main" })),
    ...end.map((d) => num(d, { segment: "end" })),
  ];
}
