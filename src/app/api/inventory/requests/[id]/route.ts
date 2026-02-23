import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import InventoryRequest from '@/models/InventoryRequest';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Allow updating status or other fields
    const updatedRequest = await InventoryRequest.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    
    if (!updatedRequest) {
       return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await params;
    const deleted = await InventoryRequest.findByIdAndDelete(id);
    if (!deleted) {
       return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
