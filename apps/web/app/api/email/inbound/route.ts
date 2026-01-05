import { NextRequest, NextResponse } from "next/server";
import { sendEmail, extractEmailAddress, stripHtmlTags } from "@/lib/sendgrid";
import { processWithAgent } from "@/lib/agent";
import { getEmailRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { MESSAGES } from "@vibe-planning/shared";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fromHeader = formData.get("from") as string;
    const subject = formData.get("subject") as string;
    const text = formData.get("text") as string;
    const html = formData.get("html") as string;

    if (!fromHeader) {
      return NextResponse.json(
        { error: "Missing from address" },
        { status: 400 },
      );
    }

    const fromEmail = extractEmailAddress(fromHeader);
    const messageBody = text || stripHtmlTags(html || "");

    if (!messageBody.trim()) {
      return NextResponse.json(
        { error: "Empty message body" },
        { status: 400 },
      );
    }

    const { success: withinLimit } = await checkRateLimit(getEmailRatelimit());
    if (!withinLimit) {
      await sendEmail({
        to: fromEmail,
        subject: `Re: ${subject}`,
        text: MESSAGES.rateLimitExceeded,
      });
      return NextResponse.json({ success: true, rateLimited: true });
    }

    const agentResponse = await processWithAgent({
      channel: "email",
      message: messageBody,
      context: { subject },
    });

    await sendEmail({
      to: fromEmail,
      subject: `Re: ${subject}`,
      text: agentResponse.message,
    });

    return NextResponse.json({
      success: true,
      actions: agentResponse.actions.length,
      tokensUsed: agentResponse.metadata.tokensUsed,
    });
  } catch (error) {
    console.error("[Email Inbound] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
