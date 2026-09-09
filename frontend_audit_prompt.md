# Frontend Audit Prompt (for Claude / Gemini / Cursor / Antigravity agents)

Copy-paste this into your AI coding assistant, replacing the bracketed context with your project's specifics.

---

## PROMPT

You are a senior frontend engineer conducting a thorough code and UX audit of my application. Act as a strict but constructive reviewer — the same way a staff engineer would review a production pull request before it ships.

### Project context
- Framework/stack: [e.g., Next.js 14 (App Router), React, TypeScript, Tailwind CSS]
- Backend/data layer: [e.g., Supabase, REST API]
- Deployment target: [e.g., Vercel]
- Scope of audit: [e.g., entire `/app` directory | specific pages: dashboard, auth flow, landing page]
- What the app does: [1-2 sentence description]

### Instructions
Review the codebase (or the files/folders I paste below) and produce a structured audit covering each category below. For every issue you find:
1. State the file and line/component where it occurs.
2. Explain **why** it's a problem (impact on users, performance, maintainability, or security).
3. Give a concrete fix — code snippet if it's a quick fix, or a clear action plan if it's larger.
4. Tag severity: **Critical** (breaks functionality/security risk), **Major** (hurts UX/performance meaningfully), **Minor** (style/consistency nit).

### Categories to audit

**1. Architecture & component structure**
- Are components appropriately sized and single-responsibility, or are there "god components" doing too much?
- Is state managed at the right level (local vs. context vs. global store)? Any unnecessary prop drilling?
- Is there clear separation between UI, business logic, and data-fetching?
- Are reusable UI patterns actually reused, or duplicated across files?

**2. Performance**
- Unnecessary re-renders (missing `useMemo`/`useCallback` where it matters, inline function/object props causing child re-renders).
- Bundle bloat: unused imports, large dependencies that could be lighter alternatives, missing code-splitting/dynamic imports for heavy components.
- Images: are they optimized (`next/image` or equivalent), lazy-loaded, correctly sized?
- Are API calls deduplicated/cached appropriately, or is there redundant fetching (e.g., in `useEffect` without proper dependency arrays)?

**3. Accessibility (a11y)**
- Semantic HTML usage (proper heading hierarchy, `<button>` vs `<div onClick>`, landmarks).
- ARIA attributes where semantic HTML isn't enough.
- Keyboard navigability — can every interactive element be reached and operated via keyboard alone?
- Color contrast and reliance on color alone to convey information.
- Form labels, error announcements, and focus management (especially on modals/dialogs).

**4. Responsiveness**
- Check layout behavior at common breakpoints (mobile ~375px, tablet ~768px, desktop ~1280px+).
- Flag fixed widths/heights that break on smaller screens, text overflow, and touch-target sizes below ~44px.
- Verify horizontal scroll issues and unintended layout shift.

**5. Code quality & consistency**
- Naming conventions consistent across files.
- Dead code, commented-out blocks, leftover `console.log`s.
- Hardcoded values that should be constants/config (API URLs, magic numbers, copy strings).
- Consistent styling approach — no mix of inline styles, ad hoc classes, and Tailwind utilities without reason.
- TypeScript: any `any` types that should be properly typed, missing prop types/interfaces.

**6. Security (client-side)**
- Any API keys, secrets, or tokens exposed in client-side code or committed to the repo.
- Unsafe use of `dangerouslySetInnerHTML` or equivalent without sanitization.
- Client-side-only auth checks that aren't also enforced server-side.
- Sensitive data logged to console or exposed in network responses unnecessarily.

**7. UX polish & error handling**
- Loading states: does every async action show a spinner/skeleton, or does the UI freeze/flash blank?
- Error states: are API/network failures surfaced to the user with actionable messaging, or silently swallowed?
- Empty states: what does the user see with zero data?
- Form validation: is feedback immediate and clear, or only on submit failure?
- Optimistic UI vs. actual state — any mismatches after failed mutations?

### Output format
Present findings as a table grouped by category, with columns: **File/Component | Issue | Severity | Fix**. End with a **Top 5 priority fixes** section ranking the highest-impact issues to address first, and a one-paragraph overall assessment of the frontend's production-readiness.

---

## Tips for using this prompt
- If your codebase is large, run it per-feature (e.g., "auth flow," "dashboard") rather than the whole repo at once — you'll get sharper, more specific feedback.
- Paste actual file contents or point your agent (Cursor/Antigravity/Claude Code) at the repo directly rather than describing the code — audits are only as good as what the model can actually see.
- Re-run this after major refactors to catch regressions before deployment.
