import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const students = await prisma.student.findMany({
      take: limit,
      orderBy: { registerNumber: 'asc' },
      select: {
        id: true,
        name: true,
        registerNumber: true,
        department: true,
        year: true,
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const data = students.map((s) => ({
      id: s.id,
      name: s.name || s.user?.name || 'Student',
      registerNumber: s.registerNumber,
      regNo: s.registerNumber,
      department: s.department,
      dept: s.department,
      year: s.year,
      avatarUrl: s.user?.avatarUrl || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Failed to fetch students from DB:', error);
    return NextResponse.json(
      { error: error.message || 'Database query failed', data: [] },
      { status: 500 }
    );
  }
}
