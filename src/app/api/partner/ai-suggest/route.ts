import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQCLOUD });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, context } = body as { step: string; context: Record<string, any> };

    const prompts: Record<string, string> = {
      basics: `You are a professional Indian travel tour planner helping a local partner create a tour listing.
Based on the following tour context, suggest:
1. A compelling tour title (max 12 words, no generic words like "amazing")
2. A short description (1 sentence, max 20 words, for card previews)
3. A detailed description (3-4 sentences, vivid, mentions key sights)
4. 5-6 key highlights (each max 12 words, start with a strong verb)

Context:
- Destination: ${context.destination || "not set"}
- Duration: ${context.days || "?"} days / ${context.nights || "?"} nights
- Travel styles: ${context.travelStyles?.join(", ") || "not set"}
- Budget per person: ₹${context.price || "not set"}
- Starting city: ${context.startCity || "not set"}

Respond ONLY with valid JSON in this exact format:
{
  "title": "...",
  "shortDescription": "...",
  "description": "...",
  "highlights": ["...", "...", "...", "...", "..."]
}`,

      inclusions: `You are a professional Indian travel tour planner.
Suggest realistic tour inclusions and exclusions for this tour:
- Destination: ${context.destination || "not set"}
- Duration: ${context.days || "?"} days / ${context.nights || "?"} nights
- Travel styles: ${context.travelStyles?.join(", ") || "not set"}
- Budget per person: ₹${context.price || "not set"}
- Food plan: ${context.foodPlan || "pure-veg"}
- Physical rating: ${context.physicalRating || "not set"}

Suggest 6-8 inclusions (what IS included) and 4-5 exclusions (what is NOT included).
Be specific and realistic for Indian domestic group tours.

Respond ONLY with valid JSON:
{
  "inclusions": ["...", "...", "...", "...", "...", "..."],
  "exclusions": ["...", "...", "...", "..."]
}`,

      itinerary: `You are a professional Indian travel tour planner.
Create a detailed day-by-day itinerary for this tour:
- Destination: ${context.destination || "not set"}  
- Duration: ${context.days || 3} days / ${context.nights || 2} nights
- Travel styles: ${context.travelStyles?.join(", ") || "sightseeing"}
- Starting city: ${context.startCity || "not set"}
- Budget: ₹${context.price || "not set"} per person
- Physical rating: ${context.physicalRating || "2 - Light / Moderate"}
- Food plan: ${context.foodPlan || "pure-veg"}
- Highlights: ${context.highlights?.join(", ") || ""}

Create exactly ${context.days || 3} itinerary days. Each day should:
- Have a catchy title (5-8 words)
- Detailed description (3-4 sentences with specific timings, activities, meals)
- Mention meals (Breakfast/Lunch/Dinner as applicable)
- Mention accommodation type

Respond ONLY with valid JSON:
{
  "itinerary": [
    {
      "day": 1,
      "title": "...",
      "description": "...",
      "meals": "Breakfast, Lunch, Dinner",
      "stay": "Standard Hotel"
    }
  ]
}`,

      faqs: `You are a professional Indian travel tour planner.
Generate 4 realistic FAQs that travellers commonly ask about this tour:
- Destination: ${context.destination || "not set"}
- Duration: ${context.days || "?"} days
- Travel styles: ${context.travelStyles?.join(", ") || "not set"}
- Physical rating: ${context.physicalRating || "not set"}
- Budget: ₹${context.price || "not set"} per person

FAQs should address: booking process, physical difficulty, what to carry, cancellation, group size, special needs.

Respond ONLY with valid JSON:
{
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}`,
    };

    const prompt = prompts[step];
    if (!prompt) return NextResponse.json({ error: "Unknown step" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("AI suggest error:", err);
    return NextResponse.json({ error: err.message || "AI suggestion failed" }, { status: 500 });
  }
}

