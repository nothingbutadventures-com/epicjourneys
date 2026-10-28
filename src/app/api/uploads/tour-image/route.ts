import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { MAX_INPUT_BYTES, optimizeImage } from "@/lib/image-optimize";
import { deleteHostedImage, publicUrl, storageConfigured, uploadObject } from "@/lib/supabase";
import { LARGE_SUFFIX, SMALL_SUFFIX } from "@/lib/images";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";

export const runtime = "nodejs";

const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

// Admin uploads a tour cover photo: it is shrunk to two AVIF sizes and stored in Supabase.
export async function POST(req: NextRequest) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    if (!storageConfigured()) return NextResponse.json({ error: "Image storage isn't set up yet. Add the Supabase keys to the environment, or paste an image URL for now.", code: "NOT_CONFIGURED" }, { status: 503 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (file.size > MAX_INPUT_BYTES) return NextResponse.json({ error: `That photo is ${(file.size / 1048576).toFixed(1)} MB. The limit is 15 MB.` }, { status: 413 });

    const out = await optimizeImage(Buffer.from(await file.arrayBuffer()));
    const base = `tours/${out.hash}`;
    await Promise.all([uploadObject(`${base}${LARGE_SUFFIX}`, out.large.data, "image/avif"), uploadObject(`${base}${SMALL_SUFFIX}`, out.small.data, "image/avif")]);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl(`${base}${LARGE_SUFFIX}`),
        thumbUrl: publicUrl(`${base}${SMALL_SUFFIX}`),
        width: out.large.width,
        height: out.large.height,
        originalBytes: out.originalBytes,
        storedBytes: out.large.data.length + out.small.data.length,
      },
    });
  } catch (error: any) {
    const known = /valid image|Use a JPG|too small/.test(error.message || "");
    if (!known) console.error("POST /api/uploads/tour-image error:", error);
    return NextResponse.json({ error: known ? error.message : "Couldn't upload the image. Please try again." }, { status: known ? 400 : 500 });
  }
}

// Removes an uploaded cover that was never used on a tour (e.g. the admin picked another photo before saving).
export async function DELETE(req: NextRequest) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    const { url } = await req.json();
    if (!url || !storageConfigured()) return NextResponse.json({ success: true });
    await connectToDatabase();
    // A photo that any tour still uses is never deleted.
    if (await Tour.exists({ coverImage: url })) return NextResponse.json({ success: true, kept: true });
    await deleteHostedImage(String(url));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
