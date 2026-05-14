# Placely — Data Workspace & Bulk Import: Implementation Plan

---

## Overview

This document captures the agreed-upon plan to replace the current "Bulk Neural Import" modal with a full **Data Workspace** — a Google Sheets-style grid embedded inside the Placely admin UI, supporting both live data viewing and smart bulk imports with column mapping.

---

## What We're Building

A two-mode grid system inside the Students / Data section of the admin panel:

| Mode | Description | Persistence |
|------|-------------|-------------|
| **Live View** | Displays actual database records, editable in-place | Permanent — writes directly to DB |
| **Import Sheet** | A temporary staging layer for uploaded or pasted data | Session-only — discarded or merged after confirmation |

---

## The 4-Stage Import Flow

### Stage 1 — Live View (Always-On Default)
- The grid opens showing real DB records for the selected data type (e.g., Students) and batch/year
- Staff can edit cells directly — changes auto-save (with undo support)
- Tabs at the bottom like Google Sheets: `Students 2021` | `Students 2022` | `Results 2022` etc.
- Filter, search, and sort by branch, year, placement status directly in the grid
- "Export current view" downloads exactly what's visible as CSV

### Stage 2 — Import Trigger
- Staff clicks **"+ Import Sheet"** button
- A new **STAGING** tab appears (visually distinct — light yellow/orange tint, badge label)
- Staff can paste data directly from Excel/Google Sheets (Ctrl+V), or upload a CSV file
- The CSV populates the grid — staff see the raw data before anything is committed

### Stage 3 — Column Mapping
- System runs **fuzzy auto-mapping** immediately (e.g., "Reg.No" → `register_number`, "CGPA (10)" → `cgpa`)
- A mapping panel appears above the grid:

```
Your Column        →    Placely Field
─────────────────────────────────────────
"Reg.No"           →   [Register Number  ▼]
"Student Name"     →   [Full Name        ▼]
"Dept"             →   [Department       ▼]
"CGPA (10)"        →   [CGPA             ▼]
"yr of join"       →   [Enrollment Year  ▼]
"fathers name"     →   [⚠ No match — Skip ▼]
```

- Staff correct any wrong auto-mappings using dropdowns
- Irrelevant columns can be marked **Skip**
- Mapping profiles can be **saved and reused** (e.g., "Anna University Export Format")

### Stage 4 — Preview Merge + Conflict Resolution
- A diff view shows inside the grid:

```
Reg. No   │ DB Value (current) │ Import Value  │ Action
──────────┼────────────────────┼───────────────┼─────────────
21CS001   │ CGPA: 8.2          │ CGPA: 8.5     │ [Update ▼]
21CS002   │ ── not in DB ──    │ Name: Priya   │ [Insert ▼]
21CS047   │ CGPA: 7.8          │ CGPA: 7.8     │ [No Change]
```

- Staff set a **global conflict rule**: Update all / Skip existing / Ask per row
- **"Confirm Merge"** commits everything → staging tab disappears → live view refreshes
- A **Download Error Report** button appears if any rows failed (CSV of only failed rows + reasons)

---

## Supported Import Data Types

Beyond the current two (Students Directory, Academic Results), the grid should support:

- Placement History (past drive results, CTC data by year)
- Companies & Job Drives (company visits, rounds, eligibility criteria)
- Internship Records (role, company, duration, stipend)
- Shortlist & Round Data (per-drive shortlist sheets, ATS outcomes)
- Offer & Joining Records (offer metadata, accepted/rejected, joining status)
- Staff & Department Directory
- Notices & Events (bulk past circulars)

---

## Grid Feature Requirements

| Feature | Priority | Notes |
|---------|----------|-------|
| Paste from Excel / Google Sheets (Ctrl+V) | 🔴 Must Have | Core adoption driver |
| Inline cell editing | 🔴 Must Have | Live view + staging both |
| Real-time row validation (red = error, yellow = warning) | 🔴 Must Have | Prevents bad data entering DB |
| Import button disabled until 0 errors | 🔴 Must Have | Critical data guard |
| Column mapping with fuzzy auto-suggest | 🔴 Must Have | Colleges have messy CSVs |
| Batch / Year selector before import | 🔴 Must Have | 4 years of data needs tagging |
| Multi-tab sheet view (like Google Sheets tabs) | 🟡 Should Have | Year/batch navigation |
| Saved column mapping profiles | 🟡 Should Have | Reuse legacy system formats |
| Merge diff preview (DB vs Import side-by-side) | 🟡 Should Have | Trust-building before commit |
| Download error report (failed rows CSV) | 🟡 Should Have | Helps staff fix and re-upload |
| Freeze first column (Register Number) | 🟡 Should Have | UX when scrolling wide sheets |
| Export current view as CSV | 🟡 Should Have | Operational shortlist sharing |
| Rollback / Undo last import | 🟢 Nice to Have | Safety net for big batches |
| Cell-level audit trail (who edited, when) | 🟢 Nice to Have | Institutional trust |
| Bulk fill (fill down a column range) | 🟢 Nice to Have | Set same branch for 60 students |

---

## Recommended Tech Library

**AG Grid Community Edition** (free, MIT-friendly for open use) or **React Data Grid by adazzle** (MIT).

Both support:
- Paste from clipboard
- Custom cell renderers (dropdowns, date pickers, colored validation states)
- Virtual scrolling (handles 5000+ rows without lag)
- Column pinning / freezing

---

## Implementation Priority Order

| # | What to Build | Why |
|---|---------------|-----|
| 1 | Live grid showing DB records | The foundation everything else sits on |
| 2 | Paste / CSV upload → populates staging grid | Removes the blind-upload problem |
| 3 | Real-time cell validation (red/yellow) + Import button guard | Stops bad data at the door |
| 4 | Column mapping panel with fuzzy auto-suggest | Handles messy college CSV exports |
| 5 | Batch / Year selector | Correct tagging for 4-year onboarding |
| 6 | Merge diff preview + conflict resolution | Staff confidence before commit |
| 7 | Multi-tab sheet view | Navigate years/data types comfortably |
| 8 | Saved mapping profiles | Speed up repeat imports |
| 9 | Error report download | Fix-and-re-upload workflow |
| 10 | Rollback, audit trail, bulk fill | Polish and institutional trust |

---

## Plain English Summary

*(See section below)*

---

## In Simple Words — What Are We Actually Building?

Right now, Placely's bulk import is a basic modal where you pick a data type, drop a CSV, and pray it works. That's not good enough for a college that needs to upload 4 years of student records, results, internships, offers, and placement history.

**Here's what the new system will feel like:**

Think of opening a Google Sheet — but instead of a blank sheet, you're looking at your actual student data from the database. Every row is a real student record. You can click any cell and edit it directly. That change saves to the database. Done.

Now let's say you got an Excel export from the university's legacy system. You click **"+ Import Sheet"**. A new tab opens right there (like a new sheet tab at the bottom of Google Sheets). You paste your Excel data into it with Ctrl+V, or you upload the CSV. Your data appears in the grid immediately.

But here's the smart part — Placely looks at your column names ("Reg.No", "CGPA (10)", "yr of join") and tries to figure out which database field each one matches. It shows you a panel saying *"I think 'Reg.No' means Register Number — is that right?"* You fix whatever it got wrong, and mark the columns you don't care about as Skip.

Then before anything actually gets saved, Placely shows you a side-by-side comparison: *"This student already exists in the database with CGPA 8.2, but your sheet says 8.5 — should I update it?"* You can say "update everything", "skip everything that already exists", or go row by row. Only after you say **"Confirm"** does the data actually merge.

If some rows had problems (wrong email format, CGPA over 10, duplicate register number), Placely downloads a small CSV with just those broken rows so you can fix them and re-upload.

The result: staff never have to leave Placely to manage data. No more maintaining a "master Excel" on someone's desktop. The grid inside Placely becomes their spreadsheet — just smarter, safer, and connected to real data.
