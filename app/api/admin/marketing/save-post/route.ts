import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// Endpoint to save a Marketing Post from the external bot.
// Protected by a simple secret since the bot is internal.
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    // Simple shared secret check (ensure you have BOT_API_SECRET in your env)
    const expectedSecret = process.env.BOT_API_SECRET || "marketing-bot-secret-123";
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const data = await req.json();
    const { imageUrl, caption, hashtags, style, status, igMediaId } = data;

    if (!imageUrl || !caption || !style) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const post = await prisma.marketingPost.create({
      data: {
        imageUrl,
        caption,
        hashtags: hashtags || "",
        style,
        status: status || "PENDING_APPROVAL",
        igMediaId
      }
    });

    return new NextResponse(JSON.stringify({ success: true, post }), { status: 201 });
  } catch (error: any) {
    console.error("Error saving marketing post:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
