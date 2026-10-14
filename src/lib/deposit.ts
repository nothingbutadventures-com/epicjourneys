// Pay-a-deposit plan: a minimum deposit now (set per tour), and the whole remaining balance
// due BALANCE_DUE_DAYS_BEFORE days before the journey starts. Shared by client and server.

export type DepositType = "amount" | "percentage";

export const BALANCE_DUE_DAYS_BEFORE = 30;
const DAY = 24 * 60 * 60 * 1000;

export interface DepositConfig {
  type?: DepositType;
  value?: number; // ₹ per person when type is "amount", otherwise a percentage of the total
}

export interface ScheduleItem {
  index: number;
  label: string;
  amountInr: number;
  dueDate: Date;
}

export function balanceDueDate(startDate: string | Date): Date {
  return new Date(new Date(startDate).getTime() - BALANCE_DUE_DAYS_BEFORE * DAY);
}

/** Deposit payable now for a booking, capped at the total. */
export function depositAmount(total: number, travellers: number, cfg: DepositConfig): number {
  const value = Math.max(0, Number(cfg.value) || 0);
  const raw = cfg.type === "amount" ? value * travellers : (total * Math.min(value, 100)) / 100;
  return Math.min(total, Math.round(raw));
}

export function depositOption(opts: {
  total: number;
  travellers: number;
  startDate: string | Date;
  cfg: DepositConfig;
  now?: Date;
}): { available: boolean; deposit: number; reason?: string } {
  const now = opts.now ?? new Date();
  const deposit = depositAmount(opts.total, opts.travellers, opts.cfg);
  if (!(Number(opts.cfg.value) > 0) || deposit <= 0) {
    return { available: false, deposit: 0, reason: "This tour doesn't offer a deposit option." };
  }
  if (balanceDueDate(opts.startDate).getTime() <= now.getTime()) {
    return { available: false, deposit, reason: `This journey starts within ${BALANCE_DUE_DAYS_BEFORE} days, so the full amount is due now.` };
  }
  if (deposit >= opts.total) {
    return { available: false, deposit, reason: "The deposit would cover the full amount — pay in full instead." };
  }
  return { available: true, deposit };
}

export function buildSchedule(opts: {
  total: number;
  strategy: "full" | "deposit";
  deposit: number;
  startDate: string | Date;
  now?: Date;
}): ScheduleItem[] {
  const now = opts.now ?? new Date();
  if (opts.strategy === "full") return [{ index: 0, label: "Full payment", amountInr: opts.total, dueDate: now }];
  return [
    { index: 0, label: "Deposit", amountInr: opts.deposit, dueDate: now },
    { index: 1, label: "Remaining balance", amountInr: opts.total - opts.deposit, dueDate: balanceDueDate(opts.startDate) },
  ];
}
