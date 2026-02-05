import connectToDatabase from '@/lib/db';
import Entity from '@/models/Entity';
import Category from '@/models/Category';
import EntityList from '@/components/expenses/EntityList';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ categoryId: string }>;
}

async function getCategoryData(id: string) {
  await connectToDatabase();
  try {
    const category = await Category.findById(id).lean();
    if (!category) return null;
    
    const entities = await Entity.find({ category: id }).sort({ name: 1 }).lean();
    
    return {
      category: JSON.parse(JSON.stringify(category)),
      entities: JSON.parse(JSON.stringify(entities))
    };
  } catch (e) {
    return null;
  }
}

export default async function CategoryDetailPage(props: Props) {
  const params = await props.params;
  const data = await getCategoryData(params.categoryId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">{data.category.name}</h2>
        <p className="text-muted-foreground">Manage entities for {data.category.name}</p>
      </div>
      
      <EntityList 
        categoryId={params.categoryId} 
        categoryName={data.category.name}
        initialEntities={data.entities} 
      />
    </div>
  );
}
