// Partner commission: a % of what customers pay on bookings made for the partner's location.
// Earned grows as payments come in; pending is what the rest of a confirmed booking will add.

export interface CommissionRow {
  bookingId: string;
  bookingRef: string;
  customer: string;
  tour: string;
  travelDate: string;
  status: string;
  total: number;
  paid: number;
  earned: number;
  pending: number;
}

export function bookingCommission(b: any, percent: number) {
  if (!b || b.status === "cancelled") return { earned: 0, pending: 0 };
  const total = b.totalAmountInr || 0;
  const paid = Math.min(total, b.amountPaidInr || 0);
  const earned = Math.round((paid * percent) / 100);
  // Unpaid holds aren't confirmed yet, so nothing is pending on them.
  const pending = b.status === "confirmed" ? Math.round(((total - paid) * percent) / 100) : 0;
  return { earned, pending };
}

export function commissionRows(bookings: any[], percent: number): CommissionRow[] {
  return bookings.map((b) => {
    const { earned, pending } = bookingCommission(b, percent);
    return {
      bookingId: String(b._id),
      bookingRef: b.bookingRef,
      customer: b.customerName,
      tour: b.tourTitle,
      travelDate: b.travelDate,
      status: b.status,
      total: b.totalAmountInr || 0,
      paid: Math.min(b.totalAmountInr || 0, b.amountPaidInr || 0),
      earned,
      pending,
    };
  });
}
