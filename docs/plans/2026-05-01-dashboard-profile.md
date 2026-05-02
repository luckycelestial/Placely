# Placely Initial Setup & Student Screens Implementation Plan (Next.js)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize the Placely project with Next.js and implement the Student Dashboard and Profile screens.

**Architecture:** A modern Next.js 15+ App Router application. The UI will follow a "Clean Operational" aesthetic with a white/light base and blue accents. Navigation will be sidebar-based for desktop and bottom-bar-based for mobile, managed through Next.js Layouts.

**Tech Stack:** Next.js 15+, React 19, TypeScript, Tailwind CSS, Lucide React (icons), Framer Motion (animations).

---

### Task 1: Project Initialization & Theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Configure Tailwind Theme**
Update `tailwind.config.ts` with Placely brand colors (Primary Blue: #2563eb).

**Step 2: Setup Global Styles**
Update `src/app/globals.css` with base styles, custom scrollbars, and standard layout resets.

**Step 3: Commit**
Run: `git add . && git commit -m "chore: setup tailwind theme and global styles"`

---

### Task 2: Student Layout (Shell)

**Files:**
- Create: `src/components/layout/StudentShell.tsx`
- Create: `src/components/navigation/Sidebar.tsx`
- Create: `src/components/navigation/BottomNav.tsx`
- Create: `src/app/(student)/layout.tsx`

**Step 1: Implement Sidebar component**
A sticky left sidebar for desktop.

**Step 2: Implement BottomNav component**
A fixed bottom bar for mobile.

**Step 3: Create Student Shell wrapper**
A component that orchestrates sidebar and bottom nav based on viewport.

**Step 4: Create (student) Route Group Layout**
Apply the Student Shell to all routes in `src/app/(student)`.

**Step 5: Commit**
Run: `git add src && git commit -m "feat: implement student shell and responsive navigation layouts"`

---

### Task 3: Student Dashboard Screen

**Files:**
- Create: `src/app/(student)/dashboard/page.tsx`
- Create: `src/components/dashboard/StatCard.tsx`
- Create: `src/components/dashboard/ActiveDrives.tsx`

**Step 1: Build StatCard component**
Cards for Profile Completeness, Application Summary, etc.

**Step 2: Build ActiveDrives section**
A list/grid of upcoming and eligible placement drives.

**Step 3: Assemble Dashboard Page**
Follow the spec in `Student/dashboard.md`.

**Step 4: Commit**
Run: `git add src && git commit -m "feat: implement student dashboard with status summaries and active drives"`

---

### Task 4: Student Profile Screen

**Files:**
- Create: `src/app/(student)/profile/page.tsx`
- Create: `src/components/profile/ProfileSection.tsx`
- Create: `src/components/profile/AcademicDetails.tsx`

**Step 1: Build ProfileSection component**
A card-based section wrapper for profile data.

**Step 2: Build AcademicDetails section**
Structured display for CGPA, marks, and backlogs.

**Step 3: Assemble Profile Page**
Follow the spec in `Student/profile.md` with read/edit toggles.

**Step 4: Commit**
Run: `git add src && git commit -m "feat: implement structured student profile with academic and identity sections"`
