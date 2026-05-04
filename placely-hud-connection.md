# Placely HUD connection instructions

## Goal
Connect the Supabase database schema to the Placely HUD and all screen modules so the frontend reads and writes real data instead of mock data.

## Important direction
- Use the existing HUD / screen structure as the consumer of the database.
- The student HUD and admin HUD should both read from the same schema in their own Supabase project.
- Replace hardcoded values with live queries.
- Keep the data flow simple and predictable.

## HUD mapping principle
Every screen should map to one or more database entities.

- Student dashboard should read student profile, applications, eligible drives, notifications, and progress summaries.
- Student profile should read and update student, contact, academics, preferences, profile, and document records.
- Drives screen should read companies, job_drives, drive_rounds, and eligibility information.
- My Applications should read applications and application_timeline.
- ATS timeline should read application_timeline and linked drive data.
- Offers & Joining should read offers and joinees.
- Notifications should read notifications.
- Documents Center should read student_documents.
- Admin dashboard should read summary counts, pending queues, analytics_snapshots, and recent activity.
- Students screen should read students plus related contact, academic, profile, and application data.
- Companies & Job Drives should read companies, job_drives, and drive_rounds.
- Applications screen should read applications and application_timeline.
- ATS Tracker should read application_timeline and drive_rounds.
- Offers & Joinees should read offers and joinees.
- Notices & Events should read notices and events.
- Reports & Analytics should read analytics_snapshots and any supporting summary views.
- Settings should read settings and other system config tables.

## Required integration tasks

### 1. Create database access layer
- Build a clean data access layer for all screens.
- Do not query tables directly from UI code everywhere.
- Use a small number of reusable functions or services.

### 2. Create screen-to-query mapping
- Each HUD screen should have a clear list of queries it needs.
- Each screen should only fetch the minimum fields required.
- Use views or joined queries for dashboard screens.

### 3. Replace mock content
- Replace placeholder cards, lists, and counts with real database data.
- Make sure the dashboard cards, filters, and lists all load from the schema.

### 4. Connect forms to writes
- Student profile edits should update student tables.
- Drive creation forms should insert into company and job drive tables.
- Application workflow actions should update application records and timeline rows.
- Offer and joining actions should update offers and joinees tables.
- Notice and event forms should write to notices and events tables.

### 5. Use summary views for fast HUD loading
- Dashboard screens should use summary views or precomputed snapshots.
- Avoid loading giant raw tables when a summary object is enough.
- Use analytics snapshots for charts and totals where possible.

### 6. Add detail drilldowns
- Clicking a dashboard card should open the related detail table or modal.
- Clicking a student should open the student record and related data.
- Clicking a drive should open the drive detail and rounds.
- Clicking an application should open its timeline.

### 7. Keep tenant flow clean
- Each Supabase project belongs to one college.
- The HUD should not need cross-college switching inside the database.
- The frontend should simply connect to the correct project for that college.

## Screen data connections

### Student HUD
- Dashboard: student profile summary, applications, drives, notifications, progress.
- Profile: student, contacts, academics, preferences, profile, documents.
- Drives: companies, job_drives, drive_rounds.
- Applications: applications, application_timeline.
- ATS timeline: application_timeline, job_drives, drive_rounds.
- Offers & Joining: offers, joinees.
- Notifications: notifications.
- Documents: student_documents.

### Admin HUD
- Dashboard: summary counts, pending items, analytics_snapshots, recent activity.
- Students: students, contacts, academics, preferences, profiles, applications.
- Companies & Job Drives: companies, job_drives, drive_rounds.
- Applications: applications, application_timeline.
- ATS Tracker: application_timeline, drive_rounds.
- Offers & Joinees: offers, joinees.
- Notices & Events: notices, events.
- Reports & Analytics: analytics_snapshots, views, summary queries.
- Settings: settings.

## Implementation order

1. Connect the database to the HUD through a shared access layer.
2. Wire student dashboard first.
3. Wire student profile and drives.
4. Wire applications, ATS, and offers.
5. Wire admin dashboard and students.
6. Wire admin drives, applications, ATS, offers, and notices.
7. Wire analytics and settings.
8. Replace all mock data with real data.

## API and query rules
- Fetch only the fields needed by the active screen.
- Prefer simple joins and views over repeated merge logic.
- Keep list queries paginated.
- Use filtered reads for tables with many rows.
- Use summary views for dashboard counts and charts.

## Form and action rules
- All save buttons must perform real writes.
- All status changes must update the proper table and related history row.
- All notifications should be created when an important event happens.
- All detail pages should load from live data, not local constants.

## Expected outcome
After this is done, the Placely HUD should feel fully connected to the database:
- cards show real values
- lists show real records
- forms save real changes
- timelines show real history
- dashboards reflect live operations
