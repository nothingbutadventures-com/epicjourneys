import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { phoneRegex, sendWhatsAppText, toE164, verifySignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Meta calls this once when you save the webhook URL in the App Dashboard.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (
    q.get("hub.mode") === "subscribe" &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    q.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

interface WaMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
  image?: { caption?: string };
  document?: { caption?: string; filename?: string };
  location?: { name?: string; address?: string };
}

function messageText(m: WaMessage): string {
  switch (m.type) {
    case "text":
      return m.text?.body ?? "";
    case "button":
      return m.button?.text ?? "";
    case "interactive":
      return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
    case "image":
      return `[Image] ${m.image?.caption ?? ""}`.trim();
    case "document":
      return `[Document] ${m.document?.caption ?? m.document?.filename ?? ""}`.trim();
    case "location":
      return `[Location] ${[m.location?.name, m.location?.address].filter(Boolean).join(", ")}`;
    default:
      return `[${m.type} message]`;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    await connectToDatabase();

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const names: Record<string, string> = {};
        for (const c of value.contacts ?? []) names[c.wa_id] = c.profile?.name ?? "";

        for (const m of (value.messages ?? []) as WaMessage[]) {
          // Meta retries on non-200s; skip messages we've already stored.
          if (await Lead.exists({ "activities.externalId": m.id })) continue;

          const text = messageText(m) || "(empty message)";
          const profileName = names[m.from] || "";
          const activity = {
            type: "note" as const,
            title: "WhatsApp message received",
            description: text,
            createdBy: profileName || toE164(m.from),
            externalId: m.id,
            createdAt: new Date(),
          };

          // Reuse the customer's open lead if there is one.
          const existing = await Lead.findOne({
            customerPhone: phoneRegex(m.from),
            stage: { $nin: ["won", "lost"] },
          }).sort({ updatedAt: -1 });

          if (existing) {
            existing.activities.push(activity);
            await existing.save();
            continue;
          }

          await Lead.create({
            title: `WhatsApp enquiry – ${profileName || toE164(m.from)}`,
            customerName: profileName || toE164(m.from),
            customerPhone: toE164(m.from),
            stage: "new",
            priority: "medium",
            source: "whatsapp",
            createdRole: "system",
            requirements: text,
            tags: ["whatsapp"],
            activities: [activity],
          });

          if (process.env.WHATSAPP_AUTO_REPLY) {
            await sendWhatsAppText(m.from, process.env.WHATSAPP_AUTO_REPLY);
          }
        }
      }
    }
  } catch (err) {
    // Still 200 so Meta doesn't hammer us with retries; the error is logged.
    console.error("WhatsApp webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}
