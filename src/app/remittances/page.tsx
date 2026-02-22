import RemittanceManager from '@/components/remittances/RemittanceManager';
import connectToDatabase from '@/lib/db';
import Remittance from '@/models/Remittance';

export const dynamic = 'force-dynamic';

export default async function RemittancesPage() {
  await connectToDatabase();
  
  // Fetch initial remittances
  const remittances = await Remittance.find({}).sort({ date: -1 }).lean();
  
  // Serialize for client component
  const serialized = remittances.map((r: any) => ({
    ...r,
    _id: r._id.toString(),
    date: r.date.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1 md:gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Remittances</h1>
        <p className="text-sm text-muted-foreground">Log and track all INR to RUB transfers.</p>
      </div>
      <RemittanceManager initialRemittances={serialized} />
    </main>
  );
}
