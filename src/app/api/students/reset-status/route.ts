import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';

// This endpoint resets ALL students to active status
export async function POST() {
  await connectToDatabase();
  try {
    const result = await Student.updateMany(
      {}, // All students
      { $set: { status: 'active' } }
    );
    return NextResponse.json({ 
      success: true, 
      message: `Reset ${result.modifiedCount} students to active` 
    });
  } catch (error) {
    console.error('Error resetting students:', error);
    return NextResponse.json({ error: 'Failed to reset students' }, { status: 500 });
  }
}
