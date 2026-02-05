import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Entity from '@/models/Entity';

export async function GET(req: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  try {
    const query = categoryId ? { category: categoryId } : {};
    const entities = await Entity.find(query).sort({ name: 1 });
    return NextResponse.json(entities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const entity = await Entity.create(body);
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
  }
}
