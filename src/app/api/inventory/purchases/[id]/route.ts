import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryPurchase, InventoryItem } from '@/models/Inventory';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const existingPurchase = await InventoryPurchase.findById(id);
    if (!existingPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Calculate stock difference if quantity changed
    if (body.quantity !== undefined && body.quantity !== existingPurchase.quantity) {
       const difference = Number(body.quantity) - existingPurchase.quantity;
       await InventoryItem.findByIdAndUpdate(existingPurchase.itemRef, {
           $inc: { currentStock: difference }
       });
    }

    const updated = await InventoryPurchase.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    
    const purchase = await InventoryPurchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Revert the stock addition
    await InventoryItem.findByIdAndUpdate(purchase.itemRef, {
        $inc: { currentStock: -purchase.quantity }
    });

    await InventoryPurchase.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 });
  }
}
