import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FundRequest from '@/models/FundRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const requests = await FundRequest.find({}).sort({ dateRequested: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching fund requests:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { amountRUB, purpose, requestedBy, notes } = body;

    if (!amountRUB || !purpose || !requestedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = await FundRequest.create({
      amountRUB: Number(amountRUB),
      purpose,
      requestedBy,
      notes
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating fund request:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
