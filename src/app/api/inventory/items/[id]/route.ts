import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryItem } from '@/models/Inventory';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await InventoryItem.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    
    // Check if there are purchases or consumptions linked to this item before deleting?
    // For now, allow deletion and just cascade or ignore orphans based on mongoose setup.
    // In a strict financial system, we might want to prevent deletion if there's history.
    
    const deleted = await InventoryItem.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
