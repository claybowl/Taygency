import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/vapi";

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number (to) and message are required" },
        { status: 400 },
      );
    }

    await sendSMS({ to, message });

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
    });
  } catch (error) {
    console.error("[API] SMS test failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send SMS" },
      { status: 500 },
    );
  }
}
