import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import StaffLedger from '@/models/StaffLedger';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const ledger = await StaffLedger.findById(id);
    if (!ledger) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Allow adding to paid salary/advances directly.
    if (body.addSalaryPaidTUB) {
      const amount = Number(body.addSalaryPaidTUB);
      ledger.salaryPaidRUB += amount;
      ledger.history.push({ date: new Date(), amount, type: 'salary_paid', note: body.note });
    }
    if (body.addAdvanceRUB) {
      const amount = Number(body.addAdvanceRUB);
      ledger.advancesRUB += amount;
      ledger.history.push({ date: new Date(), amount, type: 'advance_issued', note: body.note });
    }
    if (body.addSetupCostPaidRUB) {
      const amount = Number(body.addSetupCostPaidRUB);
      ledger.setupCostPaidRUB += amount;
      ledger.history.push({ date: new Date(), amount, type: 'setup_recovered', note: body.note });
    }
    
    // Just a straight full replace if needed
    if (body.monthlySalaryRUB !== undefined) ledger.monthlySalaryRUB = body.monthlySalaryRUB;
    if (body.staffName !== undefined) ledger.staffName = body.staffName;

    // Trigger pre-save hook for balance
    await ledger.save();

    return NextResponse.json(ledger);
  } catch (error) {
    console.error('Error updating staff ledger:', error);
    return NextResponse.json({ error: 'Failed to update ledger' }, { status: 500 });
  }
}
