import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import StaffLedger from '@/models/StaffLedger';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const ledgers = await StaffLedger.find({}).sort({ staffName: 1 });
    return NextResponse.json(ledgers);
  } catch (error) {
    console.error('Error fetching staff ledgers:', error);
    return NextResponse.json({ error: 'Failed to fetch staff ledgers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { staffName, monthlySalaryRUB, setupCostOwedRUB } = body;

    if (!staffName || !monthlySalaryRUB) {
      return NextResponse.json({ error: 'Name and monthly salary required' }, { status: 400 });
    }

    const ledger = await StaffLedger.create({
      staffName,
      monthlySalaryRUB,
      salaryPaidRUB: 0,
      advancesRUB: 0,
      setupCostOwedRUB: setupCostOwedRUB ? Number(setupCostOwedRUB) : 0,
      setupCostPaidRUB: 0,
    });

    return NextResponse.json(ledger, { status: 201 });
  } catch (error) {
    console.error('Error creating staff ledger:', error);
    return NextResponse.json({ error: 'Failed to create staff ledger' }, { status: 500 });
  }
}
