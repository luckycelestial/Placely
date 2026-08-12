# CareerBridge navigation structure

This file defines how screens are connected inside the student and admin shells, and what belongs in each sidebar or navigation area.

## Overall rule

CareerBridge uses separate shells for students and admin users. The student shell focuses on self-service placement tracking, while the admin shell focuses on operations, control, and reporting.

## Public flow

Before login, users enter a tenant-aware public landing and auth flow.

### Public entry
- College-aware landing or auth page.
- Domain or subdomain-based college identification.
- Fallback college-code or email-domain selection.
- Login then routes the user into the correct shell.

## Student navigation

The student experience should stay simple and personal. It should help the student know where they are, what they need to do, and what matters next.

### Student sidebar or mobile nav
- Dashboard.
- Profile.
- Job Opportunities / Drives.
- My Applications.
- My Progress / ATS Timeline.
- Offers & Joining.
- Notifications / Task Inbox.
- Documents Center.

### Student screen connections
- Dashboard links to Profile, Drives, Applications, Progress, Offers, Notifications, and Documents.
- Profile links back to Dashboard and forward to Documents.
- Job Opportunities / Drives links to My Applications and Offers & Joining.
- My Applications links to Progress, Offers & Joining, and Notifications.
- My Progress / ATS Timeline links to Applications and Offers & Joining.
- Offers & Joining links to Applications, Progress, and Notifications.
- Notifications / Task Inbox links to the exact related screen or action.
- Documents Center links back to Profile and Dashboard.

### Student flow logic
- Dashboard is the default landing screen.
- From Dashboard, students should be able to reach every major task in one click or tap.
- Drive details should open from the Drives screen, and applying should feed directly into My Applications.
- Notifications should be task-driven, meaning they should deep-link into the exact action page.

## Admin navigation

The admin experience should feel like an operations console. It needs fast access to queues, lists, filters, approvals, reports, and settings.

### Admin sidebar
- Dashboard.
- Students.
- Companies & Job Drives.
- Applications.
- ATS Tracker.
- Offers & Joinees.
- Notices & Events.
- Reports & Analytics.
- Settings.

### Admin screen connections
- Dashboard links to every major operational screen.
- Students links to profile review, filters, verification, and related student records.
- Companies & Job Drives links to drive creation, company management, role templates, and eligibility rules.
- Applications links to application queues, statuses, shortlist handling, and drilldowns into ATS.
- ATS Tracker links to stage-level progress, interview workflow, and drive history.
- Offers & Joinees links to offer verification, joining tracking, and outcome updates.
- Notices & Events links to announcements, reminders, and calendar-style event workflows.
- Reports & Analytics links to summaries, charts, exports, and saved views.
- Settings links to roles, policies, notifications, branding, tenant configuration, and system preferences.

### Admin flow logic
- Dashboard is the default landing screen.
- Most admin cards should open the exact workflow queue behind them.
- Filters should be persistent enough to support real placement operations.
- Tables and cards should deep-link into detail views or modals where appropriate.

## Shared interaction rule

Both shells should keep navigation predictable.

- Sidebar items should represent stable modules, not temporary actions.
- Cards, alerts, and shortcuts should connect to the relevant module or detail page.
- Actions that require context, like review or approval, should land on a focused detail view.
- Notifications should always deep-link into the most relevant screen.

## Recommended route map

### Student routes
- /student/dashboard
- /student/profile
- /student/drives
- /student/applications
- /student/progress
- /student/offers
- /student/notifications
- /student/documents

### Admin routes
- /admin/dashboard
- /admin/students
- /admin/drives
- /admin/applications
- /admin/ats
- /admin/offers
- /admin/notices
- /admin/reports
- /admin/settings

## Screen relationship summary

- Public entry sends users to the correct role shell.
- Dashboard is the landing point in both shells.
- Drives and Applications form the student workflow loop.
- ATS and Offers form the deeper tracking loop.
- Admin Screens form the operational loop for data, action, verification, and reporting.

## File name
navigation-structure.md

