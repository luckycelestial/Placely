import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // API Authorization check via x-api-key header or dev mode override
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.SHEET_SYNC_API_KEY;
    const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_APP_ENV === "local";

    if (!isDev && (!expectedKey || apiKey !== expectedKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { students } = body;

    if (!Array.isArray(students)) {
      return NextResponse.json(
        { error: "Invalid payload: 'students' must be an array" },
        { status: 400 }
      );
    }

    const results = [];

    for (const studentData of students) {
      const { registerNumber, name, department, year, section, cgpa } = studentData;

      if (!registerNumber) continue;

      // Upsert student record in PostgreSQL directly with CGPA
      const updateData: any = {
        name: name || undefined,
        department: department || "AI&DS",
        year: Number(year) || 2027,
        section: section || undefined,
        cgpa: cgpa !== undefined && cgpa !== null ? Number(cgpa) : undefined,
      };

      const createData: any = {
        registerNumber: String(registerNumber),
        name: name || "Sheet Student",
        department: department || "AI&DS",
        year: Number(year) || 2027,
        section: section || "A",
        cgpa: cgpa !== undefined && cgpa !== null ? Number(cgpa) : undefined,
        placementStatus: "unplaced",
      };

      const student = await prisma.student.upsert({
        where: { registerNumber: String(registerNumber) },
        update: updateData,
        create: createData,
      });

      results.push(student);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      message: `Successfully synced ${results.length} student records from Google Sheet to local PostgreSQL!`,
      data: results,
    });
  } catch (error: any) {
    console.error("Sheet sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync sheet data" },
      { status: 500 }
    );
  }
}
