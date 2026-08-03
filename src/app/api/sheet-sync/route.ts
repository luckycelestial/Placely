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

      // Upsert student record in local PostgreSQL
      const student = await prisma.student.upsert({
        where: { registerNumber: String(registerNumber) },
        update: {
          name: name || undefined,
          department: department || "AI&DS",
          year: Number(year) || 2027,
          section: section || undefined,
        },
        create: {
          registerNumber: String(registerNumber),
          name: name || "Sheet Student",
          department: department || "AI&DS",
          year: Number(year) || 2027,
          section: section || "A",
          placementStatus: "unplaced",
        },
      });

      // Update academic record if CGPA provided
      if (cgpa !== undefined && cgpa !== null) {
        await prisma.studentAcademic.upsert({
          where: { id: student.id }, // fallback lookup or create
          update: { cgpa: Number(cgpa) },
          create: {
            studentId: student.id,
            cgpa: Number(cgpa),
          },
        }).catch(() => {
          // If 1-to-1 constraint check fails, insert directly
          return prisma.studentAcademic.create({
            data: {
              studentId: student.id,
              cgpa: Number(cgpa),
            }
          });
        });
      }

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
