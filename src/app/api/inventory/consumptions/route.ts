import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryConsumption, InventoryItem } from '@/models/Inventory';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const consumptions = await InventoryConsumption.find({})
      .populate('itemRef', 'name unit')
      .sort({ date: -1 });
    return NextResponse.json(consumptions);
  } catch (error) {
    console.error('Error fetching consumptions:', error);
    return NextResponse.json({ error: 'Failed to fetch consumptions' }, { status: 500 });
  }
}

// Consuming groceries automatically reduces inventory stock
export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { itemRef, quantityUsed, loggedBy } = body;

    if (!itemRef || !quantityUsed || !loggedBy) {
      return NextResponse.json({ error: 'Missing mandatory consumption fields.' }, { status: 400 });
    }

    const item = await InventoryItem.findById(itemRef);
    if (!item) {
      return NextResponse.json({ error: 'Invalid Item provided' }, { status: 400 });
    }

    // Optional: add a check to warn if stock goes negative, but allow it for reality reconciling

    const consumption = await InventoryConsumption.create({
      ...body,
      date: body.date ? new Date(body.date) : new Date(),
    });

    // Reduce the item's current stock
    await InventoryItem.findByIdAndUpdate(itemRef, {
      $inc: { currentStock: -Number(quantityUsed) }
    });

    return NextResponse.json(consumption, { status: 201 });
  } catch (error) {
    console.error('Error creating consumption trace:', error);
    return NextResponse.json({ error: 'Failed to create consumption log' }, { status: 500 });
  }
}
