import mongoose from "mongoose";

export const cleanMobile = (v: unknown) =>
  String(v ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const validMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

/** Validates the address list submitted by the admin form. Existing _ids are kept so tour dates stay linked. */
export function sanitizeAddresses(input: unknown): { data?: any[]; error?: string } {
  if (input === undefined || input === null) return { data: [] };
  if (!Array.isArray(input)) return { error: "Addresses must be a list" };
  const out: any[] = [];
  for (const [i, a] of (input as any[]).entries()) {
    const n = i + 1;
    const label = String(a.label ?? "").trim();
    const address = String(a.address ?? "").trim();
    if (!label) return { error: `Address ${n}: enter a name for this starting point` };
    if (!address) return { error: `Address ${n}: enter the full address` };
    const mobile = cleanMobile(a.mobile);
    const secondaryMobile = cleanMobile(a.secondaryMobile);
    if (mobile && !validMobile(mobile)) return { error: `Address ${n}: enter a valid 10-digit mobile number` };
    if (secondaryMobile && !validMobile(secondaryMobile)) return { error: `Address ${n}: enter a valid 10-digit secondary mobile number` };
    const pincode = String(a.pincode ?? "").trim();
    if (pincode && !/^\d{6}$/.test(pincode)) return { error: `Address ${n}: pincode must be 6 digits` };
    const mapUrl = String(a.mapUrl ?? "").trim();
    if (mapUrl && !/^https?:\/\//i.test(mapUrl)) return { error: `Address ${n}: map link must start with http(s)://` };
    out.push({
      ...(a._id && mongoose.isValidObjectId(a._id) ? { _id: a._id } : {}),
      label,
      address,
      landmark: String(a.landmark ?? "").trim(),
      pincode,
      mobile,
      secondaryMobile,
      mapUrl,
    });
  }
  return { data: out };
}
