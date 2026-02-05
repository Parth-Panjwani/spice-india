import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Entity from '@/models/Entity';
import Transaction from '@/models/Transaction';
import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

// DELETE a category and all its entities/transactions
export async function DELETE(request: NextRequest, props: Props) {
  try {
    const params = await props.params;
    await connectToDatabase();
    
    const categoryId = params.id;
    
    // Delete all transactions for this category
    await Transaction.deleteMany({ category: categoryId });
    
    // Delete all entities for this category
    await Entity.deleteMany({ category: categoryId });
    
    // Delete the category itself
    const result = await Category.findByIdAndDelete(categoryId);
    
    if (!result) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
