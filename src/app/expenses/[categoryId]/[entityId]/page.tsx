import connectToDatabase from '@/lib/db';
import Entity from '@/models/Entity';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import LedgerView from '@/components/expenses/LedgerView';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ categoryId: string; entityId: string }>;
}

async function getLedgerData(categoryId: string, entityId: string) {
  await connectToDatabase();
  try {
    const category = await Category.findById(categoryId).lean();
    const entity = await Entity.findById(entityId).lean();
    
    if (!category || !entity) return null;

    // Fetch initial transactions (last 6 months by default, or all?)
    // Let's fetch all for now, as client-side filtering might be smoother for small datasets.
    // Optimization: In a real app, pagination is key.
    const transactions = await Transaction.find({ 
      category: categoryId,
      entity: entityId 
    })
    .sort({ date: -1 })
    .lean();
    
    return {
      category: JSON.parse(JSON.stringify(category)),
      entity: JSON.parse(JSON.stringify(entity)),
      transactions: JSON.parse(JSON.stringify(transactions))
    };
  } catch (e) {
    return null;
  }
}

export default async function LedgerPage(props: Props) {
  const params = await props.params;
  const data = await getLedgerData(params.categoryId, params.entityId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <LedgerView 
          category={data.category}
          entity={data.entity}
          initialTransactions={data.transactions}
       />
    </div>
  );
}
