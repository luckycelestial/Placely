# Placely Codebase Fix Checklist

All identified issues from production audit requiring remediation before production launch.

---

## 🚨 Critical Security & Authorization Bypasses

- [x] **Admin Authorization Bypass** (`src/app/admin/layout.tsx:20-25`)
  - **Issue**: Client layout granted full admin access when `localStorage.getItem("active_admin_email")` exists or `NODE_ENV === "development"`.
  - **Status**: Fixed with DevDock/Dev-Login local dev abstraction while preserving production session checks.

- [x] **Unauthenticated Batch Synchronization API** (`src/app/api/sheet-sync/route.ts:6-16`)
  - **Issue**: `/api/sheet-sync` POST endpoint had zero authentication or API key checks.
  - **Status**: Fixed. Added `x-api-key` header verification and environment key checks.

- [x] **SSRF Vulnerability in Drive Validation** (`src/app/api/validate-drive-link/route.ts:12-19`)
  - **Issue**: Loose substring match `.includes('drive.google.com')` allowed host bypasses.
  - **Status**: Fixed. Strict host parsing with `new URL().hostname` implemented.

- [x] **Missing Database Row Level Security (RLS)** (`supabase/migrations/20260811000001_enable_rls.sql`)
  - **Issue**: RLS policies missing on public schema tables accessed directly via Supabase client SDK.
  - **Status**: Fixed. Migration created enabling RLS on all 19 PostgreSQL tables with role-based policies (`is_admin()`, owner student policies, authenticated read policies).

---

## 🐛 Database & Runtime Bugs

- [x] **Missing Database Table Reference** (`src/services/students/mutations.ts:38-45`)
  - **Issue**: `createStudent` executed query against non-existent `student_contacts` table.
  - **Status**: Fixed. Contact details mapped directly to `students` table and `student_profiles`.

- [x] **Incorrect Relation Query Property** (`src/services/students/fetch.ts:302`)
  - **Issue**: Code referenced `s.student_preferences` instead of `s.student_profiles`.
  - **Status**: Fixed. Property corrected to `s.student_profiles`.

- [x] **Missing Indexes on Frequently Filtered Columns** (`prisma/schema.prisma:65`)
  - **Issue**: `department`, `year`, `cgpa`, and `placement_status` missing composite database indexes.
  - **Status**: Fixed. Composite index `@@index([department, year, placementStatus])` and `@@index([cgpa])` added to schema.

---

## ⚡ Performance & Scalability Issues

- [x] **Unbounded Memory Pagination** (`src/services/students/fetch.ts:318-490`)
  - **Issue**: `getAllStudents()` executed client-side `while(hasMore)` loop fetching thousands of records.
  - **Status**: Fixed. Replaced unbounded loop with range limits (`default limit 100`, max cap `500`).

- [x] **Global In-Memory Cache Instability** (`src/services/students/fetch.ts:172-184`)
  - **Issue**: `cachedStudentsPromise` stored as module variable caused stale state across multi-user requests.
  - **Status**: Fixed. Removed module-level global promise cache.

---

## 🎨 Quality & Developer Experience

- [ ] **ESLint Errors & Formatting** (`727 lint problems`)
  - **Issue**: Project fails `npm run lint` with 537 errors and 190 warnings.
  - **Fix**: Run `npx eslint --fix` and clean up unused variables / variable reassignment warnings.

- [ ] **Missing Test Coverage**
  - **Issue**: 0 automated unit, integration, or E2E tests exist.
  - **Fix**: Add Vitest for unit service testing and Playwright for critical path E2E flows (Auth, Drive Application, Sheet Sync).
