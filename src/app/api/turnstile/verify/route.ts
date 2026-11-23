import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, action } = body;
    const remoteIp = req.headers.get("x-forwarded-for") ?? undefined;

    if (!token || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing Turnstile token or action" },
        { status: 400 }
      );
    }

    const result = await verifyTurnstileToken({
      token,
      expectedAction: action,
      remoteIp
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || "Bot verification failed" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, action: result.action });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
