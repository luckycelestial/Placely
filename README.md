# Placely (CareerBridge)

Placely is an institutional Campus Placement & Recruitment Management System designed to streamline job drives, applicant tracking, and placement statistics for colleges and universities.

## 🚀 Key Modules

- **Student Portal**: Browse eligible job drives, apply, track application progress across interview stages, and manage academic profiles & documents.
- **Admin Portal**: Coordinate company recruitment drives, configure branch/CGPA eligibility criteria, manage ATS interview pipelines, issue job offers, and export verified placement reports.
- **Analytics & Reporting**: Real-time batch-wise placement rates, department statistics, and official student performance PDF generation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage) & Prisma ORM
- **Styling**: Tailwind CSS & Framer Motion
- **Icons & UI**: `react-icons/lu`, Sonner toasts, Recharts

---

## 🏁 Getting Started

### 1. Prerequisites

- Node.js 20+
- A Supabase PostgreSQL project

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
SHEET_SYNC_API_KEY="your-sheet-sync-secret"
```

### 3. Database Schema

Generate Prisma client:

```bash
npx prisma generate
```

Apply database migrations located in `supabase/migrations/`.

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## 🧪 Verification & Build

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```
