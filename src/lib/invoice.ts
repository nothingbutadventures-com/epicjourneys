// One invoice shape, built from a booking and used by the web view, the PDF and the email.

export interface InvoiceLine { label: string; detail?: string; amount: number }
export interface Invoice {
  number: string;
  bookingRef: string;
  issuedAt: string;
  status: "paid" | "partial" | "pending" | "cancelled";
  customer: { name: string; email: string; phone: string };
  tour: { title: string; start: string; end?: string; city?: string };
  travellers: { name: string; age?: number; phone?: string; room: string }[];
  lines: InvoiceLine[];
  total: number;
  paid: number;
  balance: number;
  payments: { label: string; amount: number; status: "paid" | "pending"; date?: string; due?: string }[];
  specialRequests?: string;
  partner?: { name?: string; phone?: string; email?: string } | null;
}

export function buildInvoice(b: any, partner?: any): Invoice {
  const n = b.numberOfTravelers || (b.travellers || []).length || 1;
  const room = b.roomSupplementInr || 0;
  const disc = b.partnerDiscountInr || 0;
  const total = b.totalAmountInr || 0;
  const paid = Math.min(total, b.amountPaidInr || 0);
  // Fare is whatever remains once the supplement and discount are accounted for, so lines always add up to the total.
  const fare = total - room + disc;
  const lines: InvoiceLine[] = [{ label: "Tour fare", detail: `${n} traveller${n === 1 ? "" : "s"}${n > 0 && b.pricePerPerson * n === fare ? ` × ₹${Math.round(b.pricePerPerson).toLocaleString("en-IN")}` : ""}`, amount: fare }];
  if (room > 0) lines.push({ label: "Single room supplement", amount: room });
  if (disc > 0) lines.push({ label: b.partnerDiscountName || "Partner discount", amount: -disc });

  const firstPaid = (b.installments || []).filter((i: any) => i.status === "paid" && i.paidAt).map((i: any) => +new Date(i.paidAt)).sort()[0];
  const num = String(b.bookingRef || "").replace(/^EJ-/, "");
  return {
    number: `INV-${num}`,
    bookingRef: b.bookingRef,
    issuedAt: new Date(firstPaid || b.createdAt || Date.now()).toISOString(),
    status: b.status === "cancelled" ? "cancelled" : paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "pending",
    customer: { name: b.customerName, email: b.customerEmail, phone: b.customerPhone },
    tour: { title: b.tourTitle, start: b.travelDate, end: b.travelEndDate, city: b.departureCity },
    travellers: (b.travellers || []).map((t: any) => ({ name: `${t.firstName} ${t.lastName}`.trim(), age: t.age, phone: t.phone, room: t.roomType === "single" ? "Single room" : "Shared room" })),
    lines,
    total,
    paid,
    balance: Math.max(0, total - paid),
    payments: (b.installments || []).map((i: any) => ({ label: i.label, amount: i.amountInr, status: i.status, date: i.paidAt, due: i.dueDate })),
    specialRequests: b.specialRequests || "",
    partner: b.bookedByRole === "partner" && partner ? { name: partner.name, phone: partner.phone, email: partner.email } : null,
  };
}
