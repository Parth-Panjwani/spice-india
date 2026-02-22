import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import MealContract from '@/models/MealContract';
import Income from '@/models/Income';
import { addMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await connectToDatabase();
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const query = studentId ? { student: studentId } : {};

    const contracts = await MealContract.find(query)
      .populate('student', 'fullName studentId')
      .sort({ createdAt: -1 });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching meal contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch meal contracts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { studentId, mealType, durationMonths, startDate, amountINR, rubalRate } = body;

    if (!studentId || !mealType || !durationMonths || !startDate || !amountINR || !rubalRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = addMonths(start, Number(durationMonths));
    const amountRUB = Number(amountINR) * Number(rubalRate);

    // 1. Create the Meal Contract
    const contract = await MealContract.create({
      student: studentId,
      mealType,
      durationMonths,
      startDate: start,
      endDate: end,
      amountINR,
      rubalRate,
      amountRUB,
      status: 'active'
    });

    // 2. Automatically log the related Income
    await Income.create({
      amount: amountINR,
      rubalAmount: amountRUB,
      rubalRate: rubalRate,
      date: new Date(),
      source: 'Student Fee',
      description: `Meal Contract: ${mealType} (${durationMonths} month/s)`,
      student: studentId
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating meal contract:', error);
    return NextResponse.json({ error: 'Failed to create meal contract' }, { status: 500 });
  }
}
