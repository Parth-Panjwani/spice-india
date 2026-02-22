import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Remittance from '@/models/Remittance';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await Remittance.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Remittance not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating remittance:', error);
    return NextResponse.json({ error: 'Failed to update remittance' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const deleted = await Remittance.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Remittance not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting remittance:', error);
    return NextResponse.json({ error: 'Failed to delete remittance' }, { status: 500 });
  }
}
