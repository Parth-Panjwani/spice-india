import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Student from '@/models/Student';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import Entity from '@/models/Entity';
import MealContract from '@/models/MealContract';
import Remittance from '@/models/Remittance';
import { InventoryItem, InventoryPurchase, InventoryConsumption } from '@/models/Inventory';
import StaffLedger from '@/models/StaffLedger';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { confirmed } = await req.json();
    if (!confirmed) {
       return NextResponse.json({ error: 'Not confirmed' }, { status: 400 });
    }

    await Promise.all([
       Income.deleteMany({}),
       Student.deleteMany({}),
       Transaction.deleteMany({}),
       Category.deleteMany({}),
       Entity.deleteMany({}),
       MealContract.deleteMany({}),
       Remittance.deleteMany({}),
       InventoryItem.deleteMany({}),
       InventoryPurchase.deleteMany({}),
       InventoryConsumption.deleteMany({}),
       StaffLedger.deleteMany({})
    ]);

    return NextResponse.json({ message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  }
}
