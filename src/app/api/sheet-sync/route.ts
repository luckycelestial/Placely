import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
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
