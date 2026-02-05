import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Student from '@/models/Student'; // Ensure Student model is registered

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    
    const query = studentId ? { student: studentId } : {};

    const incomes = await Income.find(query)
      .populate('student', 'fullName studentId')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { amount, date, description, studentId, rubalAmount, rubalRate } = body;

    if (!amount || !studentId) {
       return NextResponse.json({ error: 'Amount and Student are required' }, { status: 400 });
    }

    const income = await Income.create({
      amount,
      rubalAmount,
      rubalRate,
      date: date || new Date(),
      source: 'Student Fee', // Hardcoded for this use case
      description: description || 'Mess Fee',
      student: studentId
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 });
  }
}
