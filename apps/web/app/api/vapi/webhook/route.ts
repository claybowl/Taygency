import { NextRequest, NextResponse } from "next/server";
import { extractPhoneNumber } from "@/lib/vapi";
import { processWithAgent } from "@/lib/agent";
import { getSmsRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { MESSAGES } from "@vibe-planning/shared";
import type { VAPIWebhookPayload } from "@vibe-planning/shared";

export async function POST(req: NextRequest) {
  try {
    const payload: VAPIWebhookPayload = await req.json();

    if (
      payload.message?.type !== "conversation-update" ||
      payload.message?.role !== "user"
    ) {
      return NextResponse.json({ success: true });
    }

    const phoneNumber = extractPhoneNumber(payload.message);
    const messageContent = payload.message.content;

    if (!phoneNumber || !messageContent) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const { success: withinLimit } = await checkRateLimit(getSmsRatelimit());
    if (!withinLimit) {
      return NextResponse.json({
        success: true,
        response: MESSAGES.rateLimitExceeded,
        rateLimited: true,
      });
    }

    const agentResponse = await processWithAgent({
      channel: "sms",
      message: messageContent,
      context: { phoneNumber },
    });

    return NextResponse.json({
      success: true,
      response: agentResponse.message,
    });
  } catch (error) {
    console.error("[VAPI Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
