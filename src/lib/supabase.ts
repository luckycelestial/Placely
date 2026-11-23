import { createClient } from '@supabase/supabase-js';
import { apiCall } from './api-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const rawClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'placely-auth-token'
  }
});

/**
 * Universal backend proxy for supabase.from(table)
 * Direct database invocations from the frontend are intercepted and
 * forwarded to the Next.js backend API (/api/rpc).
 * All queries execute in Node.js on the server.
 */
function createServerQueryProxy(table: string) {
  let selectStr = '*';
  const filters: Array<{ column: string; op: 'eq' | 'neq' | 'in' | 'ilike'; value: unknown }> = [];
  let orderObj: { column: string; ascending?: boolean } | undefined;
  let limitNum: number | undefined;

  const builder: any = {
    select(s?: string) {
      if (s) selectStr = s;
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, op: 'eq', value });
      return builder;
    },
    neq(column: string, value: unknown) {
      filters.push({ column, op: 'neq', value });
      return builder;
    },
    in(column: string, value: unknown) {
      filters.push({ column, op: 'in', value });
      return builder;
    },
    ilike(column: string, value: unknown) {
      filters.push({ column, op: 'ilike', value });
      return builder;
    },
    order(column: string, opts?: { ascending?: boolean }) {
      orderObj = { column, ascending: opts?.ascending ?? true };
      return builder;
    },
    limit(l: number) {
      limitNum = l;
      return builder;
    },
    range(from: number, to: number) {
      limitNum = to - from + 1;
      return builder;
    },
    async maybeSingle() {
      const res = await builder;
      return { data: Array.isArray(res?.data) ? (res.data[0] || null) : res?.data, error: res?.error || null };
    },
    async single() {
      const res = await builder;
      const row = Array.isArray(res?.data) ? (res.data[0] || null) : res?.data;
      return { data: row, error: row ? null : new Error("Record not found") };
    },
    then(resolve: any, reject: any) {
      apiCall("executeServerQuery", {
        table,
        select: selectStr,
        filters,
        order: orderObj,
        limit: limitNum,
      })
        .then((data) => resolve({ data, error: null }))
        .catch((error) => resolve({ data: null, error }));
    },
    async insert(records: any[]) {
      try {
        const data = await apiCall("upsertTableData", table, records);
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    update(values: any) {
      return {
        eq(col: string, val: any) {
          return {
            then(resolve: any) {
              apiCall("updateTableCell", table, val, values)
                .then((data) => resolve({ data, error: null }))
                .catch((error) => resolve({ data: null, error }));
            }
          };
        }
      };
    },
    delete() {
      return {
        eq(col: string, val: any) {
          return {
            then(resolve: any) {
              apiCall("deleteStudentProject", val)
                .then((data) => resolve({ data, error: null }))
                .catch((error) => resolve({ data: null, error }));
            }
          };
        }
      };
    }
  };

  return builder;
}

export const supabase = new Proxy(rawClient, {
  get(target, prop: string) {
    if (prop === 'from') {
      return (table: string) => createServerQueryProxy(table);
    }
    return (target as any)[prop];
  }
});
