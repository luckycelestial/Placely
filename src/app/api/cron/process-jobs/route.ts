import { NextResponse } from "next/server";
import { runJobProcessingCycle, enqueueJob } from "@/server/services/queue";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secretKey = process.env.QUEUE_SECRET_KEY;

    if (!secretKey) {
      if (process.env.NODE_ENV === "production") {
        console.error("[Cron Auth] Critical: QUEUE_SECRET_KEY is not configured.");
        return NextResponse.json({ ok: false, error: "Server authentication misconfigured." }, { status: 500 });
      }
    }

    const effectiveKey = secretKey || "placely-queue-dev-secret";

    // Strict authentication check: Header must be present and match Bearer secret
    if (!authHeader || authHeader !== `Bearer ${effectiveKey}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Missing or invalid secret key" }, { status: 401 });
    }

    const result = await runJobProcessingCycle(25);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Background processing error";
    console.error("[Cron Job Process Error]:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Support GET for standard Cloudflare Cron or Vercel Cron invocation
export async function GET(req: Request) {
  return POST(req);
}
