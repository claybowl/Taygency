import { NextRequest, NextResponse } from "next/server";
import { processWithAgent } from "@/lib/agent";

interface SimulatorRequest {
  channel: "email" | "sms";
  message: string;
  context?: {
    from?: string;
    subject?: string;
    phoneNumber?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SimulatorRequest = await req.json();

    const { channel, message, context = {} } = body;

    if (!channel || !message) {
      return NextResponse.json(
        { error: "Missing channel or message" },
        { status: 400 },
      );
    }

    if (channel !== "email" && channel !== "sms") {
      return NextResponse.json(
        { error: "Invalid channel. Must be 'email' or 'sms'" },
        { status: 400 },
      );
    }

    const agentResponse = await processWithAgent({
      channel,
      message,
      context: {
        subject: context.subject,
        phoneNumber: context.phoneNumber,
      },
    });

    return NextResponse.json({
      success: true,
      response: agentResponse,
    });
  } catch (error) {
    console.error("[Simulator] Error:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
