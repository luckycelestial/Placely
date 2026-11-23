import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Static, sanitized mock student profiles for local UI demo/testing only
const MOCK_DEMO_STUDENTS = [
  {
    id: "demo-student-001",
    name: "Alex Rivera",
    registerNumber: "RA2311003010001",
    regNo: "RA2311003010001",
    department: "Computer Science",
    dept: "CSE",
    year: 2027,
    avatarUrl: null,
  },
  {
    id: "demo-student-002",
    name: "Sarah Chen",
    registerNumber: "RA2311003010002",
    regNo: "RA2311003010002",
    department: "Information Technology",
    dept: "IT",
    year: 2027,
    avatarUrl: null,
  },
  {
    id: "demo-student-003",
    name: "Priya Sharma",
    registerNumber: "RA2311003010003",
    regNo: "RA2311003010003",
    department: "Artificial Intelligence",
    dept: "AI&DS",
    year: 2026,
    avatarUrl: null,
  },
];

export async function GET() {
  // Demo accounts are strictly disabled in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Demo endpoint is disabled in production." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: MOCK_DEMO_STUDENTS,
  });
}
