import RemittanceManager from '@/components/remittances/RemittanceManager';
import connectToDatabase from '@/lib/db';
import Remittance from '@/models/Remittance';
import FundRequest from '@/models/FundRequest';

export const dynamic = 'force-dynamic';

export default async function RemittancesPage() {
  await connectToDatabase();
  
  // Fetch initial remittances (Recent 100)
  const remittances = await Remittance.find({}).sort({ date: -1 }).limit(100).lean();
  
  // Fetch initial fund requests (Recent 100)
  const fundRequests = await FundRequest.find({}).sort({ dateRequested: -1 }).limit(100).lean();
  
  // Serialize for client component
  const serialized = remittances.map((r: any) => ({
    ...r,
    _id: r._id.toString(),
    date: r.date.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedRequests = fundRequests.map((r: any) => ({
    ...r,
    _id: r._id.toString(),
    dateRequested: r.dateRequested.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1 md:gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Remittances</h1>
        <p className="text-sm text-muted-foreground">Log and track all INR to RUB transfers.</p>
      </div>
      <RemittanceManager initialRemittances={serialized} initialRequests={serializedRequests} />
    </main>
  );
}
