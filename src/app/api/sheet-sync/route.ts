import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // API Authorization check via x-api-key header
    const apiKey = req.headers.get("x-api-key");
    const configuredKey = process.env.SHEET_SYNC_API_KEY;
    const isProd = process.env.NODE_ENV === "production";

    // In production, require an explicitly configured non-default secret
    if (isProd && (!configuredKey || configuredKey === "dev-sheet-sync-key-12345")) {
      console.error("[Sheet Sync Security] SHEET_SYNC_API_KEY is not securely configured in production.");
      return NextResponse.json(
        { error: "Endpoint disabled: Missing secure production API key." },
        { status: 503 }
      );
    }

    const expectedKey = configuredKey || "dev-sheet-sync-key-12345";

    if (!apiKey || apiKey !== expectedKey) {
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
      const updateData: Prisma.StudentUpdateInput = {
        name: name || undefined,
        department: department || "AI&DS",
        year: Number(year) || 2027,
        section: section || undefined,
        cgpa: cgpa !== undefined && cgpa !== null ? Number(cgpa) : undefined,
      };

      const createData: Prisma.StudentCreateInput = {
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
  } catch (error: unknown) {
    console.error("Sheet sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to sync sheet data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
