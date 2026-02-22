import connectToDatabase from '@/lib/db';
import StaffLedger from '@/models/StaffLedger';
import StaffManager from '@/components/staff/StaffManager';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  await connectToDatabase();
  const ledgers = await StaffLedger.find({}).sort({ staffName: 1 }).lean();
  
  const serialized = ledgers.map((l: any) => ({
    ...l,
    _id: l._id.toString(),
    createdAt: l.createdAt?.toISOString(),
    updatedAt: l.updatedAt?.toISOString(),
  }));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Staff Wages</h1>
        <p className="text-sm text-muted-foreground">Manage and track separate monthly salary ledgers.</p>
      </div>
      <StaffManager initialLedgers={serialized} />
    </main>
  );
}
