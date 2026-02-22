import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Remittance from '@/models/Remittance';
import { InventoryPurchase, InventoryItem, InventoryConsumption } from '@/models/Inventory';
import StaffLedger from '@/models/StaffLedger';
import MealContract from '@/models/MealContract';
import { subMonths, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Fire all aggregations in parallel
    const [
      incomeRes,
      remittanceRes,
      purchaseRes,
      staffRes,
      activeContractCount,
      inventoryItems,
      recentRemittances,
      recentPurchases,
      recentConsumptions
    ] = await Promise.all([
      Income.aggregate([{ $group: { _id: null, totalINR: { $sum: '$amount' } } }]),
      Remittance.aggregate([
          { $match: { status: 'confirmed' } },
          { $group: { _id: null, totalINR: { $sum: '$amountINR' }, totalRUB: { $sum: '$amountRUB' } } }
      ]),
      InventoryPurchase.aggregate([{ $group: { _id: null, totalRUB: { $sum: '$priceRUB' } } }]),
      StaffLedger.aggregate([{ $group: { _id: null, totalPaidRUB: { $sum: '$salaryPaidRUB' }, totalPendingRUB: { $sum: { $subtract: ['$monthlySalaryRUB', { $add: ['$salaryPaidRUB', '$advancesRUB'] }] } } } }]),
      MealContract.countDocuments({ status: 'active', endDate: { $gte: new Date() } }),
      InventoryItem.find({}).lean(),
      Remittance.find().sort({ date: -1 }).limit(5).lean(),
      InventoryPurchase.find().populate('itemRef', 'name').sort({ date: -1 }).limit(5).lean(),
      InventoryConsumption.find().populate('itemRef', 'name').sort({ date: -1 }).limit(5).lean()
    ]);

    const kpis = {
      totalIncomeINR: incomeRes[0]?.totalINR || 0,
      totalRemittanceSentINR: remittanceRes[0]?.totalINR || 0,
      totalRemittanceRecvRUB: remittanceRes[0]?.totalRUB || 0,
      totalGroceryPurchasesRUB: purchaseRes[0]?.totalRUB || 0,
      totalSalaryPaidRUB: staffRes[0]?.totalPaidRUB || 0,
      totalSalaryPendingRUB: staffRes[0]?.totalPendingRUB || 0,
      activeMealStudents: activeContractCount
    };

    // Calculate Intelligence Metrics
    // Over-simplified Current Value: estimate based on arbitrary rule here, or we can just say "Low Stock Items" count
    const lowStockItems = inventoryItems.filter(i => i.currentStock < i.minimumThreshold);
    
    // Remittance vs Purchase Gap (Unspent Groceries Money in Russia from Remittances)
    // Assume a portion of remittance is for salary, so we only count purpose = "Groceries"
    const groceryRemittances = await Remittance.aggregate([
        { $match: { status: 'confirmed', purpose: 'Groceries' } },
        { $group: { _id: null, totalRUB: { $sum: '$amountRUB' } } }
    ]);
    const groceryRemittedRUB = groceryRemittances[0]?.totalRUB || 0;
    const procurementGapRUB = groceryRemittedRUB - kpis.totalGroceryPurchasesRUB;

    // Cost Per Student Per Day (Rolling 30 days)
    const thirtyDaysAgo = subMonths(new Date(), 1);
    const recentPurchasesForCost = await InventoryPurchase.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalRUB: { $sum: '$priceRUB' } } }
    ]);
    const thirtyDayCost = recentPurchasesForCost[0]?.totalRUB || 0;
    const costPerStudentPerDay = activeContractCount > 0 ? (thirtyDayCost / 30 / activeContractCount) : 0;

    // Compile Recent Activity Log
    const activity = [
        ...recentRemittances.map(r => ({ type: 'remittance', date: r.date, title: `Sent INR ${r.amountINR} (${r.purpose})` })),
        ...recentPurchases.map((p: any) => ({ type: 'purchase', date: p.date, title: `Bought ${p.itemRef?.name} for ${p.priceRUB} RUB` })),
        ...recentConsumptions.map((c: any) => ({ type: 'consumption', date: c.date, title: `Used ${c.quantityUsed} of ${c.itemRef?.name}` }))
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    // Formulate Alerts
    const alerts = [];
    if (lowStockItems.length > 0) {
        alerts.push({ type: 'danger', message: `${lowStockItems.length} items are below minimum stock thresholds.` });
    }
    if (procurementGapRUB > 50000) { // arbitrary threshold
        alerts.push({ type: 'warning', message: `High unspent grocery cash: ${procurementGapRUB} RUB remains un-invoiced.` });
    }
    if (procurementGapRUB < 0) {
        alerts.push({ type: 'danger', message: `Fraud alert: Recorded purchases exceed sent remittances by ${Math.abs(procurementGapRUB)} RUB.` });
    }
    if (costPerStudentPerDay > 400) { // e.g., > 400 RUB per day per person is high
        alerts.push({ type: 'warning', message: `High cost anomaly: ${costPerStudentPerDay.toFixed(0)} RUB per student per day over last 30 days.` });
    }

    return NextResponse.json({
      kpis,
      metrics: {
          procurementGapRUB,
          costPerStudentPerDay: costPerStudentPerDay.toFixed(0),
          lowStockCount: lowStockItems.length
      },
      alerts,
      recentActivity: activity
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
