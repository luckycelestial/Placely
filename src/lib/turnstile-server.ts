import "server-only";

const expectedHostnames = new Set(
  (process.env.TURNSTILE_HOSTNAMES ?? "localhost,127.0.0.1")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
);

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  hostname?: string;
  action?: string;
}

/**
 * Canonical Cloudflare Turnstile server-side Siteverify.
 * Never called from client; runs strictly on Node.js server.
 */
export async function verifyTurnstileToken(params: {
  token: string | null | undefined;
  expectedAction: string;
  remoteIp?: string;
}): Promise<TurnstileVerifyResult> {
  const { token, expectedAction, remoteIp } = params;

  if (!token || typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { success: false, error: "Invalid Turnstile response token" };
  }

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error("[Turnstile] TURNSTILE_SECRET is missing from environment");
    return { success: false, error: "Turnstile secret configuration missing" };
  }

  if (expectedHostnames.size === 0) {
    console.error("[Turnstile] TURNSTILE_HOSTNAMES allowlist is empty");
    return { success: false, error: "Turnstile hostname allowlist empty" };
  }

  try {
    const postBody = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {})
    });

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: postBody
    });

    if (!res.ok) {
      console.error(`[Turnstile] Siteverify returned HTTP ${res.status}`);
      return { success: false, error: `Siteverify error HTTP ${res.status}` };
    }

    const result = await res.json();

    if (!result || result.success !== true) {
      const errorCodes = Array.isArray(result?.["error-codes"]) ? result["error-codes"].join(", ") : "verification_failed";
      console.warn(`[Turnstile] Verification failed:`, errorCodes);
      return { success: false, error: `Bot verification failed: ${errorCodes}` };
    }

    if (result.action !== expectedAction) {
      console.warn(`[Turnstile] Action mismatch: expected '${expectedAction}', received '${result.action}'`);
      return { success: false, error: "Action verification mismatch" };
    }

    if (!expectedHostnames.has(result.hostname)) {
      console.warn(`[Turnstile] Hostname mismatch: '${result.hostname}' not in allowlist`, Array.from(expectedHostnames));
      return { success: false, error: "Hostname not authorized" };
    }

    return {
      success: true,
      hostname: result.hostname,
      action: result.action
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network/timeout failure";
    console.error(`[Turnstile] Verification exception:`, msg);
    // Fail closed
    return { success: false, error: "Bot verification service unavailable" };
  }
}
