/**
 * Client-Side API Bridge
 * All frontend requests go through the Next.js backend API (/api/rpc, /api/upload)
 * Automatically attaches auth tokens & session credentials.
 */

export async function getClientAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (typeof window !== "undefined") {
    // 1. Check for stored Supabase session token
    try {
      const stored = localStorage.getItem("placely-auth-token");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    // 2. Dev mode persona headers (strictly for non-production environments)
    const isProduction = process.env.NODE_ENV === "production";
    if (!isProduction) {
      const adminEmail = localStorage.getItem("active_admin_email");
      if (adminEmail) {
        headers["x-placely-admin-email"] = adminEmail;
      }

      const studentId = localStorage.getItem("active_student_id");
      if (studentId) {
        headers["x-placely-student-id"] = studentId;
      }
    }
  }

  return headers;
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const authHeaders = await getClientAuthHeaders();
  const headers = new Headers(init?.headers);

  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function apiCall<T = any>(action: string, ...args: unknown[]): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await getClientAuthHeaders()),
  };

  const res = await fetch("/api/rpc", {
    method: "POST",
    headers,
    body: JSON.stringify({ action, args }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server returned error HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Operation failed on backend");
  }

  return json.data;
}

/**
 * Uploads a file securely to Cloudflare R2 through the Next.js API.
 * Attaches authentication credentials and ensures ownership validation.
 */
export async function uploadFileToR2(
  file: File,
  category: "avatar" | "resume" | "document" = "document",
  docTitle?: string
): Promise<{ url: string; key: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (docTitle) {
    formData.append("docTitle", docTitle.trim());
  }

  const res = await authenticatedFetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Upload failed with HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Obtains a short-lived presigned download URL for an R2 storage key.
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const res = await authenticatedFetch(`/api/upload?key=${encodeURIComponent(key)}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to generate download URL (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.url;
}

/**
 * Deletes a file from Cloudflare R2 with ownership verification.
 */
export async function deleteFileFromR2(key: string): Promise<boolean> {
  const res = await authenticatedFetch(`/api/upload?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to delete file from storage (HTTP ${res.status})`);
  }

  const data = await res.json();
  return Boolean(data.success);
}
