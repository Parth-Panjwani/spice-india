import connectToDatabase from '@/lib/db';
import Category, { ICategory } from '@/models/Category';
import CategoryList from '@/components/expenses/CategoryList';

export const dynamic = 'force-dynamic';

async function getCategories() {
  await connectToDatabase();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  // Serialize Mongoose docs to plain objects
  return JSON.parse(JSON.stringify(categories)); 
}

export default async function ExpensesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Expenses & Ledger</h2>
      </div>
      <CategoryList initialCategories={categories} />
    </div>
  );
}
