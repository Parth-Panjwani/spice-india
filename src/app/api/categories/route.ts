import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export async function GET() {
  await connectToDatabase();
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const category = await Category.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
