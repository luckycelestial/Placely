# Placely database setup instructions

## Goal
Create the full Placely Supabase database schema for the v2 platform. The database should support the student portal, admin portal, placement workflows, analytics, and document references.

## Important direction
- Build for PostgreSQL on Supabase.
- Keep the schema normalized.
- Use UUID primary keys where appropriate.
- Add timestamps on all major tables.
- Use foreign keys everywhere data is related.
- Add unique constraints for identity fields that must not duplicate.
- Use link-first document storage where possible.
- Do not store large binary files in tables.

## Architecture note
Each college will have its own separate Supabase project.

- Do not add `college_id` to every table.
- Keep the schema clean for a single college deployment.
- Reuse the same schema across colleges, but each deployment has its own isolated database.
- This keeps the app simpler while preserving data ownership and trust.

## Tables to create

### 1. users
Stores every system user.

Suggested fields:
- id
- role
- name
- email
- phone
- avatar_url
- status
- created_at
- updated_at

### 2. students
Stores student identity and academic basics.

Suggested fields:
- id
- user_id
- register_number
- roll_number
- department
- year
- section
- gender
- date_of_birth
- placement_status
- profile_completion
- verification_status
- created_at
- updated_at

### 3. student_contacts
Stores contact details for students.

Suggested fields:
- id
- student_id
- college_email
- personal_email
- phone
- address
- city
- state
- pincode
- created_at
- updated_at

### 4. student_academics
Stores academic performance and eligibility inputs.

Suggested fields:
- id
- student_id
- cgpa
- tenth_score
- twelfth_score
- diploma_score
- backlog_count
- current_backlogs
- history_of_backlogs
- created_at
- updated_at

### 5. student_preferences
Stores placement preferences.

Suggested fields:
- id
- student_id
- preferred_roles
- preferred_locations
- shift_preference
- travel_preference
- placement_interest
- work_mode_preference
- created_at
- updated_at

### 6. student_profiles
Stores profile completeness and structured placement profile metadata.

Suggested fields:
- id
- student_id
- resume_url
- linkedin_url
- github_url
- portfolio_url
- profile_completion
- verification_status
- notes
- created_at
- updated_at

### 7. student_documents
Stores document metadata using link-first references.

Suggested fields:
- id
- student_id
- document_type
- title
- url
- storage_path
- is_required
- verification_status
- created_at
- updated_at

### 8. companies
Stores company master data.

Suggested fields:
- id
- name
- website
- industry
- hr_name
- hr_email
- hr_phone
- status
- created_at
- updated_at

### 9. job_drives
Stores structured drive data.

Suggested fields:
- id
- company_id
- title
- role_title
- drive_type
- package_ctc
- location
- job_description
- eligibility_rules
- application_start
- application_end
- drive_start
- drive_end
- status
- created_by
- created_at
- updated_at

### 10. drive_rounds
Stores ATS or hiring stages for each drive.

Suggested fields:
- id
- drive_id
- round_name
- round_order
- round_type
- instructions
- created_at
- updated_at

### 11. applications
Stores student applications to drives.

Suggested fields:
- id
- student_id
- drive_id
- status
- applied_at
- current_stage
- next_step
- outcome
- created_at
- updated_at

### 12. application_timeline
Stores stage history for each application.

Suggested fields:
- id
- application_id
- stage_name
- stage_order
- event_type
- notes
- event_at
- created_at
- updated_at

### 13. offers
Stores offer details and lifecycle status.

Suggested fields:
- id
- student_id
- drive_id
- company_id
- role_title
- package_ctc
- offer_status
- acceptance_status
- joining_date
- verification_status
- mismatch_flag
- created_at
- updated_at

### 14. joinees
Stores final joining records.

Suggested fields:
- id
- offer_id
- student_id
- company_id
- joining_status
- joined_at
- remarks
- created_at
- updated_at

### 15. notices
Stores placement notices.

Suggested fields:
- id
- title
- body
- audience
- priority
- status
- publish_at
- created_by
- created_at
- updated_at

### 16. events
Stores placement events.

Suggested fields:
- id
- title
- description
- event_date
- start_time
- end_time
- audience
- status
- created_by
- created_at
- updated_at

### 17. notifications
Stores in-app notifications and task alerts.

Suggested fields:
- id
- user_id
- title
- message
- notification_type
- priority
- is_read
- related_entity_type
- related_entity_id
- created_at
- updated_at

### 18. analytics_snapshots
Stores precomputed summary data.

Suggested fields:
- id
- snapshot_type
- snapshot_date
- payload_json
- created_at
- updated_at

### 19. audit_logs
Stores important change history.

Suggested fields:
- id
- actor_user_id
- entity_type
- entity_id
- action
- old_data_json
- new_data_json
- created_at

### 20. settings
Stores college-level configuration.

Suggested fields:
- id
- setting_key
- setting_value_json
- created_at
- updated_at

## Relationship rules

- `students.user_id` should reference `users.id`.
- `student_contacts.student_id` should reference `students.id`.
- `student_academics.student_id` should reference `students.id`.
- `student_preferences.student_id` should reference `students.id`.
- `student_profiles.student_id` should reference `students.id`.
- `student_documents.student_id` should reference `students.id`.
- `job_drives.company_id` should reference `companies.id`.
- `drive_rounds.drive_id` should reference `job_drives.id`.
- `applications.student_id` should reference `students.id`.
- `applications.drive_id` should reference `job_drives.id`.
- `application_timeline.application_id` should reference `applications.id`.
- `offers.student_id` should reference `students.id`.
- `offers.drive_id` should reference `job_drives.id`.
- `offers.company_id` should reference `companies.id`.
- `joinees.offer_id` should reference `offers.id`.
- `joinees.student_id` should reference `students.id`.
- `joinees.company_id` should reference `companies.id`.
- `notifications.user_id` should reference `users.id`.
- `audit_logs.actor_user_id` should reference `users.id`.

## Indexing rules

Add indexes on:
- `student_id`, `user_id`, `company_id`, `drive_id`, and `application_id` where relevant.
- `email` and `register_number` where used for lookups.
- `status`, `placement_status`, `verification_status`, and `is_read` where filtered frequently.
- `snapshot_type` and `snapshot_date` in analytics tables.

## Constraints to add

- Unique `email` in users where appropriate.
- Unique `register_number` in students.
- Unique `roll_number` if used.
- Unique `college_email` if required.
- Unique combination rules for application and drive if one student can apply only once.
- Enforce non-null values for critical identity fields.
- Use check constraints for allowed statuses and enums if needed.

## Supporting views

Create useful SQL views or materialized views for:
- student dashboard summary
- eligible drives view
- application progress view
- offer summary view
- placement funnel analytics
- year-wise department analytics
- company yield analytics
- student readiness summary

## Seed data

Create starter seed rows for:
- one set of users and roles
- a few departments
- a few sample students
- a few companies
- sample job drives
- sample applications
- sample notices
- sample events
- sample analytics snapshots

## Verification of setup

After creating the schema, confirm:
- all tables exist
- foreign keys are connected
- indexes are created
- the main views work
- basic seed data inserts correctly
- student and admin workflows can query the schema cleanly

## Deliverable expectation

The final database should support the Placely screens already planned, especially:
- student dashboard
- student profile
- drives
- applications
- ATS timeline
- offers and joining
- admin dashboard
- student management
- drives management
- reports and analytics
- settings

## Notes for the agent

- Build the schema carefully and in a logical order.
- Connect tables with proper foreign keys.
- Prefer normalized design over oversized tables.
- Keep the schema future-proof for a single-college deployment.
- Ensure the schema supports production use, not just demo data.
