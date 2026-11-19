import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  DATABASE_URL: z.string().optional(),
  SHEET_SYNC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'preview', 'production', 'development']).optional().default('development'),
});

export function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SHEET_SYNC_API_KEY: process.env.SHEET_SYNC_API_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error('❌ Environment validation error:', result.error.format());
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables for production deployment.');
    }
  }

  return result.data;
}

export const env = validateEnv();
