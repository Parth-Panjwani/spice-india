import connectToDatabase from '@/lib/db';
import { InventoryItem, InventoryPurchase, InventoryConsumption } from '@/models/Inventory';
import Remittance from '@/models/Remittance';
import InventoryManager from '@/components/inventory/InventoryManager';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  await connectToDatabase();

  const items = await InventoryItem.find({}).sort({ name: 1 }).lean();
  
  const purchases = await InventoryPurchase.find({})
      .populate('itemRef', 'name unit')
      .populate('linkedRemittance', 'date amountRUB')
      .sort({ date: -1 })
      .lean();

  const consumptions = await InventoryConsumption.find({})
      .populate('itemRef', 'name unit')
      .sort({ date: -1 })
      .lean();

  const activeRemittances = await Remittance.find({ status: 'confirmed' }).sort({ date: -1 }).lean();

  const serialize = (docs: any[]) => docs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    date: doc.date ? doc.date.toISOString() : undefined,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    itemRef: doc.itemRef ? { ...doc.itemRef, _id: doc.itemRef._id.toString() } : undefined,
    linkedRemittance: doc.linkedRemittance ? { ...doc.linkedRemittance, _id: doc.linkedRemittance._id.toString(), date: doc.linkedRemittance.date.toISOString() } : undefined,
  }));

  const serializedItems = items.map((i: any) => ({ ...i, _id: i._id.toString() }));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Inventory & Kitchen</h1>
        <p className="text-sm text-muted-foreground">Manage stock, grocery purchases, and track daily food consumption.</p>
      </div>
      <InventoryManager 
         initialItems={serializedItems}
         initialPurchases={serialize(purchases)}
         initialConsumptions={serialize(consumptions)}
         remittances={serialize(activeRemittances)}
      />
    </main>
  );
}
