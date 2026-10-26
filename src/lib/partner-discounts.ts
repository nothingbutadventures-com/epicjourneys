import mongoose from "mongoose";
import Discount from "@/models/Discount";

export const PARTNER_DISCOUNT_FIELDS = "name discountType value description validUntil isActive kind";

/** Validates ids sent by the admin: they must all be real partner-type discounts. */
export async function sanitizePartnerDiscountIds(input: unknown): Promise<{ ids: string[]; error?: string }> {
  if (!Array.isArray(input)) return { ids: [], error: "Invalid discount list." };
  const ids = [...new Set(input.map(String))];
  if (ids.some((i) => !mongoose.isValidObjectId(i))) return { ids: [], error: "Invalid discount selected." };
  if (!ids.length) return { ids: [] };
  const found = await Discount.countDocuments({ _id: { $in: ids }, kind: "partner" });
  if (found !== ids.length) return { ids: [], error: "Only partner discounts can be attached to a partner." };
  return { ids };
}

/** Resolves the partner discount a partner wants on a booking, or explains why it can't be used. */
export async function resolvePartnerDiscount(partnerUserId: string, discountId: unknown, subtotal: number) {
  const User = (await import("@/models/User")).default;
  const { discountUsable, partnerDiscountAmount } = await import("@/lib/pricing");
  if (!discountId) return { discount: null as any, amountInr: 0 };
  const owner: any = await User.findById(partnerUserId).select("partnerDiscountIds").lean();
  const attached = (owner?.partnerDiscountIds || []).map(String);
  if (!mongoose.isValidObjectId(discountId) || !attached.includes(String(discountId))) {
    return { error: "That discount isn't available to your account.", status: 400 };
  }
  const discount: any = await Discount.findOne({ _id: discountId, kind: "partner" }).lean();
  if (!discount || !discountUsable(discount)) return { error: "That discount is no longer active or has expired.", status: 400 };
  return { discount, amountInr: partnerDiscountAmount(subtotal, discount) };
}

export function validateDiscountFields(body: any): string | null {
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return "Enter a discount value greater than 0.";
  if ((body.discountType || "percentage") === "percentage" && value > 100) return "A percentage discount can't be more than 100.";
  return null;
}

