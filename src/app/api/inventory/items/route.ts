import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryItem } from '@/models/Inventory';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const items = await InventoryItem.find({}).sort({ name: 1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { name, unit, minimumThreshold } = body;

    if (!name || !unit) {
      return NextResponse.json({ error: 'Name and unit are required' }, { status: 400 });
    }

    const item = await InventoryItem.create({
      name,
      unit,
      minimumThreshold: minimumThreshold || 5,
      currentStock: 0,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
