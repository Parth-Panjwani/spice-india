import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Remittance from '@/models/Remittance';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const remittances = await Remittance.find({}).sort({ date: -1 });
    return NextResponse.json(remittances);
  } catch (error) {
    console.error('Error fetching remittances:', error);
    return NextResponse.json({ error: 'Failed to fetch remittances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { amountINR, rubalRate, sentTo, purpose, proofImageUrl } = body;

    if (!amountINR || !rubalRate || !sentTo || !purpose || !proofImageUrl) {
      return NextResponse.json({ error: 'Missing required remittance fields' }, { status: 400 });
    }

    const amountRUB = Number(amountINR) * Number(rubalRate);

    const remittance = await Remittance.create({
      ...body,
      amountRUB,
      date: body.date ? new Date(body.date) : new Date(),
    });

    return NextResponse.json(remittance, { status: 201 });
  } catch (error) {
    console.error('Error creating remittance:', error);
    return NextResponse.json({ error: 'Failed to create remittance' }, { status: 500 });
  }
}
