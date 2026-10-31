import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Integration from "@/models/Integration";
import { getAuthFromRequest, isSuperAdmin } from "@/lib/auth";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";
import { clearRazorpayCache, getRazorpayCreds, testRazorpayKeys } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const PROVIDER = "razorpay";
const deny = () => NextResponse.json({ error: "Only a super admin can manage integrations." }, { status: 403 });
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const isEnv = (v: any): v is "test" | "live" => v === "test" || v === "live";

/** What the admin page may see: the public key id and whether a secret exists, never the secret itself. */
async function snapshot() {
  const doc: any = await Integration.findOne({ provider: PROVIDER }).lean();
  const pair = (e: "test" | "live") => ({
    keyId: doc?.[e]?.keyId || "",
    hasSecret: Boolean(doc?.[e]?.secretEnc),
    // A saved secret that no longer decrypts (encryption key changed) is flagged so it can be re-entered.
    unreadable: Boolean(doc?.[e]?.secretEnc) && !decryptSecret(doc[e].secretEnc),
    updatedAt: doc?.[e]?.updatedAt || null,
  });
  const active = await getRazorpayCreds();
  return {
    mode: doc?.mode === "live" ? "live" : "test",
    test: pair("test"),
    live: pair("live"),
    active: active ? { mode: active.mode, source: active.source, keyId: active.keyId } : null,
    envFallback: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    await connectToDatabase();
    return NextResponse.json({ success: true, data: await snapshot() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Save (or replace) the key pair for one environment. The keys are checked with Razorpay first. */
export async function PUT(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const body = await req.json();
    const env = body.env;
    const keyId = String(body.keyId || "").trim();
    const keySecret = String(body.keySecret || "").trim();
    if (!isEnv(env)) return bad("Choose test or live.");
    if (!keyId || !keySecret) return bad("Enter both the Key ID and the Key Secret.");
    if (!keyId.startsWith(`rzp_${env}_`)) {
      return bad(env === "test" ? "A test Key ID starts with rzp_test_. Did you paste a live key?" : "A live Key ID starts with rzp_live_. Did you paste a test key?");
    }
    const check = await testRazorpayKeys(keyId, keySecret);
    if (!check.ok) return bad(`These keys didn't work: ${check.message}`);

    await connectToDatabase();
    await Integration.findOneAndUpdate(
      { provider: PROVIDER },
      { $set: { [env]: { keyId, secretEnc: encryptSecret(keySecret), updatedAt: new Date() } }, $setOnInsert: { provider: PROVIDER, mode: env } },
      { upsert: true }
    );
    clearRazorpayCache();
    return NextResponse.json({ success: true, data: await snapshot() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Switch which saved key pair checkout uses. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const { mode } = await req.json();
    if (!isEnv(mode)) return bad("Choose test or live.");
    await connectToDatabase();
    const doc: any = await Integration.findOne({ provider: PROVIDER }).lean();
    if (!doc?.[mode]?.keyId || !decryptSecret(doc[mode].secretEnc)) return bad(`Save the ${mode} keys first.`);
    await Integration.updateOne({ provider: PROVIDER }, { $set: { mode } });
    clearRazorpayCache();
    return NextResponse.json({ success: true, data: await snapshot() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Re-check a saved key pair against Razorpay. */
export async function POST(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const { env } = await req.json();
    if (!isEnv(env)) return bad("Choose test or live.");
    await connectToDatabase();
    const doc: any = await Integration.findOne({ provider: PROVIDER }).lean();
    const secret = decryptSecret(doc?.[env]?.secretEnc);
    if (!doc?.[env]?.keyId || !secret) return bad(`No ${env} keys saved.`);
    const result = await testRazorpayKeys(doc[env].keyId, secret);
    return NextResponse.json({ success: result.ok, message: result.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Remove the saved key pair for one environment. */
export async function DELETE(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const env = new URL(req.url).searchParams.get("env");
    if (!isEnv(env)) return bad("Choose test or live.");
    await connectToDatabase();
    const other = env === "test" ? "live" : "test";
    const doc: any = await Integration.findOne({ provider: PROVIDER }).lean();
    const update: any = { $unset: { [env]: "" } };
    // If the active pair is removed, move to the other one when it has keys.
    if (doc?.mode === env && doc?.[other]?.keyId) update.$set = { mode: other };
    await Integration.updateOne({ provider: PROVIDER }, update);
    clearRazorpayCache();
    return NextResponse.json({ success: true, data: await snapshot() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
