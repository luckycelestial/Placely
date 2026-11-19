# Placely / CareerBridge: Master Production Remediation Checklist

This document contains the prioritized master list of all identified bugs, security vulnerabilities, schema desynchronizations, performance bottlenecks, architecture flaws, DevOps gaps, and maintainability issues across the codebase.

---

## 📋 Table of Contents
1. [🚨 P0: Critical Blockers (Security & Runtime Crashes)](#1-p0-critical-blockers-security--runtime-crashes)
2. [⚠️ P1: High Priority (Data Integrity, Auth & Performance)](#2-p1-high-priority-data-integrity-auth--performance)
3. [⚡ P2: Medium Priority (DevOps, Testing & Scalability)](#3-p2-medium-priority-devops-testing--scalability)
4. [🛠️ P3: Code Quality, Frontend UX & Maintainability](#4-p3-code-quality-frontend-ux--maintainability)
5. [🔒 Compliance & Security Threat Mitigations](#5-compliance--security-threat-mitigations)

---

## 1. 🚨 P0: Critical Blockers (Security & Runtime Crashes)

### 1.1 Non-Existent Tables in `updateStudentProfile` & `bulk.ts` ✅ FIXED
- **Files**: [`src/services/students/mutations.ts:205-348`](file:///home/luckycelestial/Pavithran/Placely/src/services/students/mutations.ts#L205-L348), [`src/services/students/bulk.ts:60-239`](file:///home/luckycelestial/Pavithran/Placely/src/services/students/bulk.ts#L60-L239), [`src/services/analytics.ts:320-335`](file:///home/luckycelestial/Pavithran/Placely/src/services/analytics.ts#L320-L335), [`src/app/(student)/profile/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/profile/page.tsx), [`src/app/(student)/drives/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/drives/page.tsx)
- **Problem**: Code executed queries against non-existent database tables: `student_academics`, `student_contacts`, and `student_preferences`.
- **Status**: Remediated.
  - Mapped contact fields (`address`, `permanent_address`, `city`, `state`, `pincode`, `personal_email`, `phone`) directly to the `students` table.
  - Mapped academic scores (`cgpa`, `tenth_score`, `twelfth_score`, `diploma_score`, `active_arrears`, `history_of_backlogs`, `semester_cgpa`) directly to the `students` table.
  - Mapped preference fields (`placement_interest`, `preferred_roles`, `preferred_locations`, `work_mode_preference`, `specializations`) directly to `student_profiles`.

### 1.2 Non-Existent Tables across UI Views ✅ FIXED
- **Files**:
  - `student_projects`: [`src/components/leaderboard/LeaderboardView.tsx:48`](file:///home/luckycelestial/Pavithran/Placely/src/components/leaderboard/LeaderboardView.tsx#L48), [`src/app/(student)/progress/page.tsx:155`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/progress/page.tsx#L155)
  - `admin_tasks`: [`src/app/admin/dashboard/page.tsx:91`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/dashboard/page.tsx#L91)
  - `notice_rsvps`: [`src/app/admin/notices/rsvp-modal.tsx:38,46`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/notices/rsvp-modal.tsx#L38)
  - `placement_history`: [`src/services/analytics.ts:6`](file:///home/luckycelestial/Pavithran/Placely/src/services/analytics.ts#L6)
- **Status**: Remediated.
  - Added models (`StudentProject`, `AdminTask`, `NoticeRsvp`, `PlacementHistory`) and foreign key relations to [`prisma/schema.prisma`](file:///home/luckycelestial/Pavithran/Placely/prisma/schema.prisma).
  - Created migration [`supabase/migrations/20260909000000_add_missing_tables.sql`](file:///home/luckycelestial/Pavithran/Placely/supabase/migrations/20260909000000_add_missing_tables.sql) with tables and indexes.
  - Added defensive optional chaining and fallback handlers across components.

### 1.3 Client-Side Admin Authorization Bypass ✅ FIXED
- **Files**: [`src/app/admin/layout.tsx:19-50`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/layout.tsx#L19-L50)
- **Problem**: Admin portal layout checked `localStorage.getItem("active_admin_email")` or dev environment flags to grant access without validating the user's role against the database.
- **Status**: Remediated. Admin layout strictly checks database `users.role` (`admin` or `staff`) via Supabase auth before granting access.

### 1.4 Anonymous Database Grants Overriding RLS ✅ FIXED
- **Files**: [`supabase/migrations/20260909000001_revoke_anon_write.sql`](file:///home/luckycelestial/Pavithran/Placely/supabase/migrations/20260909000001_revoke_anon_write.sql)
- **Status**: Remediated. Created migration revoking destructive table mutations (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) from anonymous callers, while preserving read access for public directories and full privileges for authenticated users.

---

## 2. ⚠️ P1: High Priority (Data Integrity, Auth & Performance)

### 2.1 Database Type Mismatch on `package_ctc` ✅ FIXED
- **Files**: [`prisma/schema.prisma:157`](file:///home/luckycelestial/Pavithran/Placely/prisma/schema.prisma#L157), [`supabase/migrations/20260909000000_add_missing_tables.sql`](file:///home/luckycelestial/Pavithran/Placely/supabase/migrations/20260909000000_add_missing_tables.sql)
- **Status**: Remediated. Standardized `job_drives.package_ctc` to `VARCHAR(100)` in PostgreSQL migrations and Prisma schema to seamlessly support compensation ranges (`"12 - 18 LPA"`) without SQL numeric conversion failures.

### 2.2 Direct Base64 Image Uploads in Database Rows ✅ FIXED
- **Files**: [`src/app/(student)/profile/page.tsx:135-156`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/profile/page.tsx#L135-L156), [`src/services/students/mutations.ts:335-375`](file:///home/luckycelestial/Pavithran/Placely/src/services/students/mutations.ts#L335-L375)
- **Status**: Remediated. Replaced direct Base64 writes with `uploadAvatar()` storing image files in Supabase Storage (`avatars/`) and removed native `alert()` calls in favor of custom toast alerts.

### 2.3 Missing Unique Application Constraint & Atomic Offer Transactions ✅ FIXED
- **Files**: [`prisma/schema.prisma:227`](file:///home/luckycelestial/Pavithran/Placely/prisma/schema.prisma#L227), [`supabase/migrations/20260909000000_add_missing_tables.sql`](file:///home/luckycelestial/Pavithran/Placely/supabase/migrations/20260909000000_add_missing_tables.sql), [`src/services/applications.ts:487-548`](file:///home/luckycelestial/Pavithran/Placely/src/services/applications.ts#L487-L548)
- **Status**: Remediated. Added `@@unique([studentId, driveId])` constraint to `applications` table and updated `acceptOffer` to atomically synchronize student placement status (`placement_status = 'placed'`) and placement locking.

### 2.4 Unauthenticated Bypass in Sheet Sync API ✅ FIXED
- **File**: [`src/app/api/sheet-sync/route.ts:5-18`](file:///home/luckycelestial/Pavithran/Placely/src/app/api/sheet-sync/route.ts#L5-L18)
- **Status**: Remediated. Enforced strict `x-api-key` validation unconditionally across all environments.

---

## 3. ⚡ P2: Medium Priority (DevOps, Testing & Scalability)

### 3.1 ESLint Scanning Failure on Non-Source Directories ✅ FIXED
- **File**: [`eslint.config.mjs:9-22`](file:///home/luckycelestial/Pavithran/Placely/eslint.config.mjs#L9-L22)
- **Status**: Remediated. Added `doc/**`, `scratch/**`, `public/**`, `supabase/**`, and `src/scripts/**` to `globalIgnores`.

### 3.2 Automated CI/CD Pipeline ✅ FIXED
- **Files**: [`.github/workflows/ci.yml`](file:///home/luckycelestial/Pavithran/Placely/.github/workflows/ci.yml)
- **Status**: Remediated. Created comprehensive GitHub Actions CI pipeline executing Node.js 20 dependency installation, TypeScript type checking (`tsc --noEmit`), and ESLint verification on push and pull requests.

### 3.3 Client-Side Analytics Data Reduction
- **File**: [`src/services/analytics.ts:136-250`](file:///home/luckycelestial/Pavithran/Placely/src/services/analytics.ts#L136-L250)
- **Problem**: `getTrendData()`, `getDepartmentAnalytics()`, and `getCompanyAnalytics()` fetch all rows from `offers` and `students` into browser memory to compute sums and averages via JavaScript loops.
- **Impact**: High client CPU consumption and excessive payload sizes as student/offer records scale into thousands.
- **Action Required**:
  - Create PostgreSQL views or RPC functions (`get_department_placement_stats`, `get_monthly_placement_trends`) to perform aggregations in the database engine.

### 3.4 Missing Foreign Key Database Indexes ✅ FIXED
- **Files**: [`prisma/schema.prisma:228,268`](file:///home/luckycelestial/Pavithran/Placely/prisma/schema.prisma#L228), [`supabase/migrations/20260909000000_add_missing_tables.sql`](file:///home/luckycelestial/Pavithran/Placely/supabase/migrations/20260909000000_add_missing_tables.sql)
- **Status**: Remediated. Added single-column indexes on `applications(student_id)`, `applications(drive_id)`, `offers(student_id)`, `offers(drive_id)`, and `offers(company_id)` across Prisma schema and PostgreSQL migrations.

---

## 4. 🛠️ P3: Code Quality, Frontend UX & Maintainability

### 4.1 Monolithic Page Components ✅ FIXED
- **Files**:
  - [`src/app/admin/students/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/students/page.tsx) (Decomposed into `src/app/admin/students/components/`)
  - [`src/app/admin/reports/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/reports/page.tsx) (Decomposed into `src/app/admin/reports/components/`)
  - [`src/app/admin/groups/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/groups/page.tsx) (Decomposed into `src/app/admin/groups/components/`)
  - [`src/app/(student)/progress/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/progress/page.tsx) (Decomposed into `src/app/(student)/progress/components/`)
  - [`src/app/(student)/profile/page.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/%28student%29/profile/page.tsx) (Decomposed into `src/app/(student)/profile/components/`)
- **Status**: Remediated. Decomposed all monolithic pages into co-located, modular sub-components, types, and custom UI dialogs with zero functional regressions and 100% clean Next.js static/dynamic route build pass.

### 4.2 Excessive `any` Type Usage
- **Files**: `src/services/students/fetch.ts`, `src/services/students/mutations.ts`, `src/services/applications.ts`
- **Problem**: Over 350+ `@typescript-eslint/no-explicit-any` instances weaken TypeScript's compile-time safety.
- **Action Required**:
  - Replace `any` with strict Prisma-generated types (`Student`, `JobDrive`, `Offer`, `User`) and custom DTO interfaces.

### 4.3 Modal Accessibility & Keyboard Trapping ✅ FIXED
- **Files**: [`src/app/admin/ats/ats-modals.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/ats/ats-modals.tsx), [`src/app/admin/drives/drive-dialog.tsx`](file:///home/luckycelestial/Pavithran/Placely/src/app/admin/drives/drive-dialog.tsx)
- **Status**: Remediated. Added `role="dialog"`, `aria-modal="true"`, dynamic `aria-labelledby` title anchors, and window `Escape` key event listeners with backdrop dismiss.

### 4.4 Live External GraphQL Polling Rate Limits
- **File**: [`next.config.ts:7-10`](file:///home/luckycelestial/Pavithran/Placely/next.config.ts#L7-L10)
- **Problem**: `/api/leetcode-graphql` proxies requests directly to `https://leetcode.com/graphql` without server-side caching.
- **Action Required**:
  - Cache LeetCode profile metrics in `student_profiles.leetcode_count` and refresh via background scheduled job rather than live on each page view.

---

## 5. 🔒 Compliance & Security Threat Mitigations

- [x] **Row Level Security (RLS)**: Enforced RLS across all 19 PostgreSQL tables with role-based policies (`is_admin()`, `current_student_id()`) and revoked `anon` destructive writes.
- [x] **Server Audit Logging on Data Exports**: Added asynchronous database logging in `audit_logs` whenever student or placement data is exported to Excel or PDF via [`src/lib/export-utils.ts`](file:///home/luckycelestial/Pavithran/Placely/src/lib/export-utils.ts).
- [x] **SSRF Hardening**: Added protocol restriction to `https:`, `redirect: 'manual'`, and `AbortSignal` timeout on [`src/app/api/validate-drive-link/route.ts`](file:///home/luckycelestial/Pavithran/Placely/src/app/api/validate-drive-link/route.ts).
- [x] **Startup Environment Validation**: Added Zod schema validation in [`src/lib/env.ts`](file:///home/luckycelestial/Pavithran/Placely/src/lib/env.ts) and build-safe defaults in [`src/lib/supabase.ts`](file:///home/luckycelestial/Pavithran/Placely/src/lib/supabase.ts).
