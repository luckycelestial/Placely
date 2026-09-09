# UI/UX Audit Prompt (for Claude / Gemini / Cursor / Antigravity agents)

Use this when you want feedback on the *experience* — flow, clarity, visual design — not the code itself. Paste screenshots, Figma links, or describe screens/flows; also works if you point an agent at your live app or component files.

---

## PROMPT

You are a senior UX/UI designer conducting a heuristic evaluation of my application, in the style of a professional UX audit. Evaluate this as if you were seeing it for the first time as a real user, not as the developer. Be honest and specific — don't just say "looks good," find the friction points.

### Project context
- Product: [1-2 sentence description of what it does and who it's for]
- Platform: [web app / mobile app / both]
- Target user: [e.g., college students, small business owners, non-technical users]
- Scope: [entire app | specific flow: onboarding, checkout, dashboard, etc.]
- What I'm sharing: [screenshots / Figma link / live URL / component code]

### Instructions
Walk through the interface as a first-time user completing a realistic task: [describe 1-2 concrete scenarios, e.g., "a new user signs up and creates their first project" or "a returning user searches for and edits an item"].

For every issue found, report:
1. **Where** — exact screen/component/flow step.
2. **What's wrong** — the specific problem, described concretely (not "confusing," but *why* it's confusing).
3. **Heuristic/principle violated** — reference which usability principle it breaks (see list below).
4. **Severity** — Critical (blocks task completion), Major (causes real friction/confusion), Minor (cosmetic/polish).
5. **Fix** — a specific, actionable recommendation.

### Evaluate against these principles (Nielsen's heuristics + practical checks)

**1. Visibility of system status**
- Does every action give immediate feedback (loading, success, error states)?
- Does the user always know what's happening — no unexplained silence or frozen UI?

**2. Match between system and real world**
- Is language user-facing plain talk, or internal/technical jargon?
- Do icons and labels mean what users would expect?

**3. User control and freedom**
- Can users undo actions or back out of a flow without penalty?
- Are there "emergency exits" from multi-step processes (modals, wizards)?

**4. Consistency and standards**
- Do buttons, colors, and patterns behave the same way across every screen?
- Does it follow platform conventions users already know (e.g., primary action on the right, destructive actions in red)?

**5. Error prevention**
- Are risky actions (delete, submit, payment) confirmed before execution?
- Does the design prevent likely mistakes rather than just reporting them after?

**6. Recognition rather than recall**
- Are options and next steps visible, or does the user need to remember what to do?
- Is required context (e.g., what was in a previous step) still visible when needed?

**7. Flexibility and efficiency**
- Are there shortcuts or accelerators for repeat/power users?
- Does the app scale from beginner to experienced use without extra friction for either?

**8. Aesthetic and minimalist design**
- Is every visible element earning its place, or is there visual clutter/competing CTAs?
- Is there a clear visual hierarchy guiding the eye to what matters most?

**9. Help users recognize, diagnose, and recover from errors**
- Are error messages written in plain language, explaining what happened and how to fix it?
- Do they avoid blaming the user or showing raw technical/error codes?

**10. Help and documentation**
- Is contextual help available where users are likely to get stuck (tooltips, inline hints)?
- Is it easy to find without hunting through a separate docs page?

### Additional checks beyond the 10 heuristics

**First impressions**
- Within 5 seconds, is it clear what the product does and what to do next?

**Visual hierarchy & consistency**
- Typography scale, spacing rhythm, and color usage consistent across screens?
- Primary vs. secondary actions visually distinguishable at a glance?

**Forms & inputs**
- Inline validation with clear, immediate feedback?
- Field labels always visible (not just as placeholder text that disappears on focus)?

**Onboarding & empty states**
- Does a brand-new user with zero data know what to do first?
- Do empty states guide toward an action rather than showing a blank void?

**Mobile & responsive behavior**
- Touch targets at least ~44px, no overlapping/cut-off elements at common breakpoints?
- Does the layout reflow sensibly, or just shrink/break?

**Accessibility**
- Sufficient color contrast, not relying on color alone to convey state/meaning?
- Logical tab order and visible focus states for keyboard users?

### Output format
1. **Executive summary** (3-4 sentences): overall impression and biggest risk to user experience.
2. **Findings table**: columns — Screen/Flow | Issue | Heuristic Violated | Severity | Recommended Fix.
3. **Impact vs. effort prioritization**: group top findings into Quick Wins (high impact, low effort), Plan For Later (high impact, high effort), and Nice-to-Haves (low impact).
4. **Top 3 things to fix before anyone else uses this.**

---

## Tips for using this prompt
- Give the agent real scenarios to walk through, not just "review this" — task-based evaluation surfaces far more real issues than a static glance.
- If you have analytics (drop-off rates, support tickets, session recordings), mention them — the audit gets sharper when grounded in real user pain points, not just visual guesswork.
- Run this separately from the code-level frontend audit; UX issues (confusing flow, unclear copy) often exist even in perfectly clean code, and vice versa.
- For a SaaS/dashboard product like yours, pay special attention to onboarding and empty states — these are the most common conversion killers in early-stage products.
