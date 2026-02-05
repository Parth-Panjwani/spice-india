import connectToDatabase from '@/lib/db';
import Entity from '@/models/Entity';
import Transaction from '@/models/Transaction';
import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

// DELETE an entity and all its transactions
export async function DELETE(request: NextRequest, props: Props) {
  try {
    const params = await props.params;
    await connectToDatabase();
    
    const entityId = params.id;
    
    // Delete all transactions for this entity
    await Transaction.deleteMany({ entity: entityId });
    
    // Delete the entity itself
    const result = await Entity.findByIdAndDelete(entityId);
    
    if (!result) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Entity deleted' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
  }
}
