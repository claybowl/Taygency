import { NextResponse } from "next/server";
import { startCall } from "@/lib/vapi";

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Phone number (to) is required" },
        { status: 400 },
      );
    }

    const { callId } = await startCall({ to, message });

    return NextResponse.json({
      success: true,
      callId,
      message: "Call initiated successfully",
    });
  } catch (error) {
    console.error("[API] Voice test failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initiate call",
      },
      { status: 500 },
    );
  }
}
