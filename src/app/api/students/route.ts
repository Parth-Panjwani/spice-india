import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    // NOTE: Auto-archive removed. Admin manually archives via UI.
    // This prevents new students from being incorrectly marked.
    const students = await Student.find({}).sort({ fullName: 1 });
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const student = await Student.create(body);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
