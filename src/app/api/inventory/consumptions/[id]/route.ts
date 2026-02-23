import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { InventoryConsumption, InventoryItem } from '@/models/Inventory';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const existingConsumption = await InventoryConsumption.findById(id);
    if (!existingConsumption) {
      return NextResponse.json({ error: 'Consumption log not found' }, { status: 404 });
    }

    // Calculate stock difference if quantity changed
    // If you used 10 instead of 5, the difference is 5. We must subtract 5 more. (new - old) -> subtract (difference)
    if (body.quantityUsed !== undefined && body.quantityUsed !== existingConsumption.quantityUsed) {
       const difference = Number(body.quantityUsed) - existingConsumption.quantityUsed;
       await InventoryItem.findByIdAndUpdate(existingConsumption.itemRef, {
           $inc: { currentStock: -difference }
       });
    }

    const updated = await InventoryConsumption.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating consumption:', error);
    return NextResponse.json({ error: 'Failed to update consumption' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    
    const consumption = await InventoryConsumption.findById(id);
    if (!consumption) {
      return NextResponse.json({ error: 'Consumption log not found' }, { status: 404 });
    }

    // Revert the stock deduction (add it back)
    await InventoryItem.findByIdAndUpdate(consumption.itemRef, {
        $inc: { currentStock: consumption.quantityUsed }
    });

    await InventoryConsumption.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting consumption:', error);
    return NextResponse.json({ error: 'Failed to delete consumption' }, { status: 500 });
  }
}
