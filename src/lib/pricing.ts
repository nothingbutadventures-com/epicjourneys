// Shared (client + server) price maths so the checkout summary always matches what the server charges.

export type RoomType = "shared" | "single";

export interface Quote {
  unitPrice: number; // per-person tour price after the date's discount
  travellers: number;
  baseTotal: number;
  singleCount: number;
  singleRoomPrice: number;
  roomSupplement: number;
  total: number;
}

export function discountedUnitPrice(price: number, discountPercentage = 0) {
  return Math.round(price * (1 - (discountPercentage || 0) / 100));
}

export function computeQuote(opts: {
  price: number;
  discountPercentage?: number;
  singleRoomPrice?: number;
  rooms: RoomType[];
}): Quote {
  const unitPrice = discountedUnitPrice(opts.price, opts.discountPercentage);
  const travellers = opts.rooms.length;
  const singleRoomPrice = Math.max(0, opts.singleRoomPrice || 0);
  const singleCount = singleRoomPrice > 0 ? opts.rooms.filter((r) => r === "single").length : 0;
  const baseTotal = unitPrice * travellers;
  const roomSupplement = singleCount * singleRoomPrice;
  return { unitPrice, travellers, baseTotal, singleCount, singleRoomPrice, roomSupplement, total: baseTotal + roomSupplement };
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export interface PartnerDiscountLike {
  discountType: "percentage" | "fixed";
  value: number;
  validUntil?: string | Date | null;
  isActive?: boolean;
}

/** A discount can be used while it is active and its last valid day (inclusive) hasn't passed. */
export function discountUsable(d: PartnerDiscountLike, now = new Date()) {
  if (d.isActive === false) return false;
  if (!d.validUntil) return true;
  const end = new Date(d.validUntil);
  end.setHours(23, 59, 59, 999);
  return end.getTime() >= now.getTime();
}

/** Partner discount taken off the booking total: a percentage of it, or a flat ₹ amount. Never more than the total. */
export function partnerDiscountAmount(subtotal: number, d: PartnerDiscountLike) {
  const raw = d.discountType === "percentage" ? (subtotal * Math.min(100, Math.max(0, d.value))) / 100 : Math.max(0, d.value);
  return Math.min(Math.round(raw), Math.max(0, Math.round(subtotal)));
}
