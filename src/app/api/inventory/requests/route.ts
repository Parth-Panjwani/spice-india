import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import InventoryRequest from '@/models/InventoryRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const requests = await InventoryRequest.find({}).sort({ dateRequested: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { itemName, quantityNeeded, unit, requestedBy, notes } = body;

    if (!itemName || !quantityNeeded || !unit || !requestedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = await InventoryRequest.create({
      itemName,
      quantityNeeded: Number(quantityNeeded),
      unit,
      requestedBy,
      notes
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory request:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
