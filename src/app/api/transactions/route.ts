import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const entityId = searchParams.get('entityId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const query: any = {};
    if (categoryId) query.category = new mongoose.Types.ObjectId(categoryId);
    if (entityId) query.entity = new mongoose.Types.ObjectId(entityId);
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('category', 'name')
      .populate('entity', 'name')
      .sort({ date: -1 });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Transaction Fetch Error:', error); // Good for debugging
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const transaction = await Transaction.create(body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Transaction Create Error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
