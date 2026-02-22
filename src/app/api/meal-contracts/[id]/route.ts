import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import MealContract from '@/models/MealContract';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await MealContract.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating meal contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const deleted = await MealContract.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
