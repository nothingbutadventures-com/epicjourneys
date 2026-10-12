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
