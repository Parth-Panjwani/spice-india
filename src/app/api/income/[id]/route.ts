import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const deleted = await Income.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Income record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 });
  }
}
