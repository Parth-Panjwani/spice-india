import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryPurchase, InventoryItem } from '@/models/Inventory';
import Remittance from '@/models/Remittance';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  try {
    const purchases = await InventoryPurchase.find({})
      .populate('itemRef', 'name unit')
      .populate('linkedRemittance', 'date amountRUB')
      .sort({ date: -1 });
    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

// Buying groceries automatically adds to inventory stock
export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { itemRef, quantity, priceRUB, invoiceImage, purchasedBy, linkedRemittance } = body;

    if (!itemRef || !quantity || !priceRUB || !invoiceImage || !purchasedBy || !linkedRemittance) {
      return NextResponse.json({ error: 'Missing mandatory fields, invoice and remittance link are required.' }, { status: 400 });
    }

    // Ensure Remittance is valid
    const remittance = await Remittance.findById(linkedRemittance);
    if (!remittance) {
      return NextResponse.json({ error: 'Invalid Remittance provided' }, { status: 400 });
    }

    const purchase = await InventoryPurchase.create({
      ...body,
      date: body.date ? new Date(body.date) : new Date(),
    });

    // Update the item's current stock
    await InventoryItem.findByIdAndUpdate(itemRef, {
      $inc: { currentStock: Number(quantity) }
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
