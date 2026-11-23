import "server-only";
import { createClient } from "@supabase/supabase-js";

const isProd = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isProd ? "" : "http://127.0.0.1:54321");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (isProd ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU");

if (isProd && (!supabaseUrl || !supabaseServiceKey)) {
  throw new Error("[Security Alert] Critical production environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.");
}

export const serverDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
