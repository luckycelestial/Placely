-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "register_number" TEXT NOT NULL,
    "roll_number" TEXT,
    "name" TEXT,
    "department" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "section" TEXT,
    "gender" TEXT,
    "date_of_birth" DATE,
    "placement_status" TEXT NOT NULL DEFAULT 'unplaced',
    "college_email" TEXT,
    "personal_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "permanent_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "cgpa" DECIMAL(4,2),
    "tenth_score" DECIMAL(5,2),
    "twelfth_score" DECIMAL(5,2),
    "diploma_score" DECIMAL(5,2),
    "active_arrears" INTEGER NOT NULL DEFAULT 0,
    "history_of_backlogs" BOOLEAN NOT NULL DEFAULT false,
    "semester_cgpa" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_policies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "min_cgpa" DECIMAL(4,2) DEFAULT 0.00,
    "max_active_arrears" INTEGER DEFAULT 0,
    "allow_history_of_backlogs" BOOLEAN DEFAULT true,
    "max_offers_allowed" INTEGER DEFAULT 1,
    "upgrade_policy_ctc_multiplier" DECIMAL(4,2) DEFAULT 1.50,
    "is_active" BOOLEAN DEFAULT true,
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "resume_url" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "profile_completion" INTEGER NOT NULL DEFAULT 0,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "leetcode_count" INTEGER DEFAULT 0,
    "specializations" JSONB,
    "preferred_roles" JSONB,
    "preferred_locations" JSONB,
    "shift_preference" TEXT,
    "travel_preference" TEXT,
    "placement_interest" TEXT,
    "work_mode_preference" TEXT,
    "leetcode_last_fetched" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "hr_name" TEXT,
    "hr_email" TEXT,
    "hr_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "logo_url" TEXT,
    "theme_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_drives" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "drive_type" TEXT NOT NULL,
    "package_ctc" TEXT,
    "location" TEXT,
    "job_description" TEXT,
    "eligibility_rules" JSONB,
    "application_start" TIMESTAMP(3),
    "application_end" TIMESTAMP(3),
    "drive_start" TIMESTAMP(3),
    "drive_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "batch" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_rounds" (
    "id" UUID NOT NULL,
    "drive_id" UUID NOT NULL,
    "round_name" TEXT NOT NULL,
    "round_order" INTEGER NOT NULL,
    "round_type" TEXT,
    "instructions" TEXT,

    CONSTRAINT "drive_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_round_results" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_round_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "student_id" UUID,
    "drive_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_stage" TEXT,
    "next_step" TEXT,
    "package_ctc" DECIMAL(6,2),
    "outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_timeline" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "stage_name" TEXT NOT NULL,
    "stage_order" INTEGER,
    "event_type" TEXT,
    "notes" TEXT,
    "event_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "student_id" UUID,
    "drive_id" UUID,
    "company_id" UUID NOT NULL,
    "role_title" TEXT NOT NULL,
    "package_ctc" DECIMAL(6,2) NOT NULL,
    "offer_status" TEXT NOT NULL DEFAULT 'issued',
    "acceptance_status" TEXT NOT NULL DEFAULT 'pending',
    "joining_status" TEXT NOT NULL DEFAULT 'pending',
    "joined_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target_department" TEXT,
    "target_year" INTEGER,
    "is_pinned" BOOLEAN DEFAULT false,
    "author_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "location" TEXT,
    "drive_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" TEXT,
    "metric_name" TEXT NOT NULL,
    "metric_value_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_data_json" JSONB,
    "new_data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role_title" TEXT,
    "drive_type" TEXT,
    "package_ctc" TEXT,
    "location" TEXT,
    "eligibility_rules" JSONB,
    "job_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_projects" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "github_url" TEXT,
    "live_url" TEXT,
    "skills" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_rsvps" (
    "id" UUID NOT NULL,
    "notice_id" TEXT NOT NULL,
    "student_id" UUID,
    "student_name" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_history" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "dept_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "hires" INTEGER NOT NULL DEFAULT 0,
    "avg_ctc" DECIMAL(6,2) DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_register_number_key" ON "students"("register_number");

-- CreateIndex
CREATE INDEX "students_department_year_placement_status_idx" ON "students"("department", "year", "placement_status");

-- CreateIndex
CREATE INDEX "students_cgpa_idx" ON "students"("cgpa");

-- CreateIndex
CREATE UNIQUE INDEX "drive_round_results_application_id_round_id_key" ON "drive_round_results"("application_id", "round_id");

-- CreateIndex
CREATE INDEX "applications_student_id_idx" ON "applications"("student_id");

-- CreateIndex
CREATE INDEX "applications_drive_id_idx" ON "applications"("drive_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_student_id_drive_id_key" ON "applications"("student_id", "drive_id");

-- CreateIndex
CREATE INDEX "offers_student_id_idx" ON "offers"("student_id");

-- CreateIndex
CREATE INDEX "offers_drive_id_idx" ON "offers"("drive_id");

-- CreateIndex
CREATE INDEX "offers_company_id_idx" ON "offers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_setting_key_key" ON "settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "drive_templates_name_key" ON "drive_templates"("name");

-- CreateIndex
CREATE INDEX "background_jobs_status_scheduled_for_idx" ON "background_jobs"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "background_jobs_job_type_idx" ON "background_jobs"("job_type");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_drives" ADD CONSTRAINT "job_drives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_rounds" ADD CONSTRAINT "drive_rounds_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "job_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_round_results" ADD CONSTRAINT "drive_round_results_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_round_results" ADD CONSTRAINT "drive_round_results_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "drive_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "job_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_timeline" ADD CONSTRAINT "application_timeline_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "job_drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "job_drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_projects" ADD CONSTRAINT "student_projects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

