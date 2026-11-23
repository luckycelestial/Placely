export interface Env {
  PLACELY_APP_URL: string;
  QUEUE_SECRET_KEY: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}

export default {
  /**
   * HTTP handler:
   * - GET /health: Health check
   * - POST /wake or /process: Receives webhook from Placely, responds immediately with 202 Accepted,
   *   and executes processing asynchronously in the background via ctx.waitUntil().
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "placely-worker", timestamp: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST" && (url.pathname === "/wake" || url.pathname === "/process" || url.pathname === "/api/cron/process-jobs")) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${env.QUEUE_SECRET_KEY}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Detached execution: client gets instant 202 response, worker completes jobs in background
      ctx.waitUntil(triggerJobProcessing(env, "webhook_wake"));

      return new Response(
        JSON.stringify({ accepted: true, message: "Background processing cycle triggered" }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },

  /**
   * Scheduled Cron Trigger handler:
   * Runs automatically every 15 minutes on Cloudflare's Free Tier!
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Placely Worker Cron]: Triggered at ${new Date(event.scheduledTime).toISOString()}`);
    ctx.waitUntil(triggerJobProcessing(env, `cron_${event.cron}`));
  },
};

/**
 * Triggers the job execution cycle against Placely's background job engine.
 */
async function triggerJobProcessing(env: Env, triggerSource: string) {
  try {
    const targetUrl = `${env.PLACELY_APP_URL}/api/cron/process-jobs`;
    console.log(`[Worker Background]: Invoking ${targetUrl} (source: ${triggerSource})...`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.QUEUE_SECRET_KEY}`,
      },
      body: JSON.stringify({ triggerSource, timestamp: Date.now() }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = await response.json();
    console.log(`[Worker Background]: Processing cycle finished:`, data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker Background Exception]:`, msg);
  }
}
