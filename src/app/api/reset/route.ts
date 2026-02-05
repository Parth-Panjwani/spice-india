import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Student from '@/models/Student';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import Entity from '@/models/Entity';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Verify confirmation (simple check)
    // In production, we'd want admin auth, but for local tool:
    const { confirmed } = await req.json();
    if (!confirmed) {
       return NextResponse.json({ error: 'Not confirmed' }, { status: 400 });
    }

    // Delete all collections
    await Promise.all([
       Income.deleteMany({}),
       Student.deleteMany({}),
       Transaction.deleteMany({}),
       // Category.deleteMany({}), // Maybe keep categories/entities? User said "Clear data of whole thing", usually implies transaction data, but a full reset implies everything. 
       // Start fresh usually means keeping structure but deleting data.
       // However, "Start from fresh" might mean total wipe. 
       // I'll wipe Categories and Entities too to be safe "fresh".
       Category.deleteMany({}),
       Entity.deleteMany({})
    ]);

    return NextResponse.json({ message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  }
}
