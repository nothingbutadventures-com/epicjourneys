// No-cost EMI plan: a down payment now, then equal monthly instalments that finish
// at least EMI_BUFFER_DAYS before the journey starts. Shared by client and server.

export const EMI_DOWN_PCT = 30;
export const EMI_GAP_DAYS = 30;
export const EMI_BUFFER_DAYS = 14;
export const EMI_MONTH_OPTIONS = [2, 3, 4, 6];

export interface ScheduleItem {
  index: number;
  label: string;
  amountInr: number;
  dueDate: Date;
}

const DAY = 24 * 60 * 60 * 1000;

/** Monthly-instalment counts (after the down payment) that still fit before the departure. */
export function availableEmiMonths(startDate: string | Date, now: Date = new Date()): number[] {
  const daysToStart = Math.floor((new Date(startDate).getTime() - now.getTime()) / DAY);
  return EMI_MONTH_OPTIONS.filter((m) => EMI_GAP_DAYS * m <= daysToStart - EMI_BUFFER_DAYS);
}

export function buildSchedule(total: number, strategy: "full" | "emi", months: number, now: Date = new Date()): ScheduleItem[] {
  if (strategy === "full" || !months) {
    return [{ index: 0, label: "Full payment", amountInr: total, dueDate: now }];
  }
  const down = Math.round((total * EMI_DOWN_PCT) / 100);
  const rest = total - down;
  const each = Math.floor(rest / months);
  const items: ScheduleItem[] = [{ index: 0, label: "Down payment", amountInr: down, dueDate: now }];
  for (let i = 1; i <= months; i++) {
    items.push({
      index: i,
      label: `EMI ${i} of ${months}`,
      amountInr: i === months ? rest - each * (months - 1) : each,
      dueDate: new Date(now.getTime() + i * EMI_GAP_DAYS * DAY),
    });
  }
  return items;
}
