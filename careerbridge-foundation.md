# CareerBridge foundation

This file locks the baseline product and build decisions for CareerBridge before individual screen specs are written. It is meant to be the single source of truth for the screen-building phase.

## Product direction

CareerBridge is being planned as a **multi-college-ready placement platform** for students and placement-cell teams, while keeping the same core structure across colleges.
Each college is expected to use the same product structure, with branding and configuration differences, while the backend database can be different per college deployment.

## Multi-college architecture

The chosen tenancy model is:

- Same codebase for all colleges.
- Separate Supabase project per college.
- Each college owns its own data and auth environment.
- Schema should stay standardized across deployments so the product remains portable and scalable later.

This means CareerBridge should be designed as a reusable product template, not as a one-off app for a single college.

## User roles

The locked roles for the first proper version are:

- Student.
- Placement Staff.
- Placement Admin.
- College Super Admin.

This role split is important because CareerBridge already implies different privilege levels across workflows like verification, drive management, ATS handling, offers, notices, exports, and settings.

## Core platform stack

The current product direction strongly implies the following baseline stack from the previous planning and existing codebase references:

| Layer | Choice |
|---|---|
| Frontend app | Web app with separate student and admin shells. |
| Backend/data | Supabase per college deployment. |
| Auth/data ownership | Managed at the college deployment level. |
| Product model | Same CareerBridge structure across colleges, configurable per tenant. |
| Documents | Link-first document handling, with file upload support as optional later. |

## Design direction

CareerBridge should behave like a product **brand**, not like a different visual system for every college.
The locked visual direction is a white or light base, blue as the primary accent, and only **very subtle** glass treatment on selected surfaces such as overlays or top bars, while the main operational UI stays crisp and solid for readability.

That means the UI should avoid overusing glassmorphism and should not rely on trendy effects that reduce clarity in dense admin workflows.

## Navigation pattern

The navigation structure is already locked for both device types.

### Desktop

- Student shell uses sidebar-based navigation.
- Admin shell uses sidebar-based navigation.
- The admin sidebar must be on the **right side**.
- The admin sidebar should collapse to icons and expand on hover on desktop.

### Mobile

- Both student and admin should use a bottom navigation bar on mobile.
- Hover behavior should not be relied on for touch devices, so admin mobile navigation should behave as an explicit drawer or toggled mobile pattern where needed.

## Public entry flow

CareerBridge will have a **tenant-aware landing and auth experience** before users enter the product shells.
The platform should primarily identify colleges through separate domains or subdomains, with fallback support through a college-code picker and/or email-domain detection.

## Student data model direction

The student profile is expected to be fully structured, not minimal.
The core profile shape includes:

- Identity data.
- Contact data.
- Academic data.
- Placement preferences.
- Professional links and achievements.
- Verification state.
- Completion tracking.

The document system is also broader than just resumes. It is planned as a configurable document center per college, but link-first so storage-heavy uploads are not mandatory.

## Workflow direction

CareerBridge is being designed as an operations-heavy system, not just a dashboard.
The product direction already locks these workflow ideas:

- Full structured job drives with reusable company and role templates.
- Student application tracking with statuses, filters, pending actions, timelines, and next-step links.
- ATS progress represented as a unified student-centric timeline with per-drive drilldown.
- Offer and joining flow that goes beyond selection and includes verification, mismatch flags, joining workflow, and post-offer clarity.
- Complex admin flows should use a hybrid approach: simple edits inline, complex workflows as wizards, with draft-save and resume-later support.
- Admin data views should support advanced filters, dynamic data shaping, and saved operational views.
- In-app notifications should behave more like a role-based task inbox than a simple bell icon.

## Screen structure

The current top-level screen count is 18 total.

### Public

- 1 tenant-aware landing/auth entry screen.

### Student

- 8 core student screens are expected in the student shell.
- Locked student areas already include Dashboard, Profile, Job Opportunities/Drives, My Applications, My Progress/ATS Timeline, Offers & Joining, Notifications/Task Inbox direction, and Documents Center direction.

### Admin

The admin shell is explicitly locked to 9 screens:

1. Dashboard.
2. Students.
3. Companies & Job Drives.
4. Applications.
5. ATS Tracker.
6. Offers & Joinees.
7. Notices & Events.
8. Reports & Analytics.
9. Settings.

## Build sequence recommendation

The best way to proceed from here is:

1. Keep this file as the baseline project brief.
2. Create one `screen_name.md` file per screen next.
3. For each screen spec, define purpose, user role, main sections, actions, states, data needed, and navigation placement.
4. Build the screens in Antigravity after each screen spec is locked.

## Naming convention for upcoming screen files

Use a simple and consistent naming pattern for the next files:

- `tenant-entry.md`
- `student-dashboard.md`
- `student-profile.md`
- `student-drives.md`
- `student-applications.md`
- `student-progress.md`
- `student-offers.md`
- `student-notifications.md`
- `student-documents.md`
- `admin-dashboard.md`
- `admin-students.md`
- `admin-companies-drives.md`
- `admin-applications.md`
- `admin-ats-tracker.md`
- `admin-offers-joinees.md`
- `admin-notices-events.md`
- `admin-reports-analytics.md`
- `admin-settings.md`

## What this file is for

This is not a detailed screen spec.
It is the foundational reference for stack, structure, navigation, workflow philosophy, and screen planning, so every later screen markdown file stays aligned with the same CareerBridge decisions.

