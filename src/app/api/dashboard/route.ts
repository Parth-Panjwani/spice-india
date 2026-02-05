import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Transaction from '@/models/Transaction';
import Student from '@/models/Student';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Run all independent queries in parallel for speed
    const [
      incomeResult,
      expenseResult,
      activeStudentsCount,
      monthlyIncomeData,
      monthlyExpenseData,
      recentIncome,
      recentExpenses
    ] = await Promise.all([
      // 1. Total Income
      Income.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, totalRubal: { $sum: '$rubalAmount' } } }
      ]),
      
      // 2. Total Expenses
      Transaction.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, totalRubal: { $sum: '$rubalAmount' } } }
      ]),
      
      // 3. Active Students Count
      Student.countDocuments({ status: 'active' }),
      
      // 4. Monthly Income (last 6 months in one query)
      Income.aggregate([
        { $match: { date: { $gte: subMonths(startOfMonth(new Date()), 5) } } },
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' }
        }},
        { $sort: { _id: 1 } }
      ]),
      
      // 5. Monthly Expenses (last 6 months in one query)
      Transaction.aggregate([
        { $match: { date: { $gte: subMonths(startOfMonth(new Date()), 5) } } },
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' }
        }},
        { $sort: { _id: 1 } }
      ]),
      
      // 6. Recent Income (limit 5)
      Income.find().sort({ date: -1 }).limit(5).select('amount date description').lean(),
      
      // 7. Recent Expenses (limit 5)
      Transaction.find().sort({ date: -1 }).limit(5).select('amount date description subType').lean()
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalRubalIncome = incomeResult[0]?.totalRubal || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const totalRubalExpenses = expenseResult[0]?.totalRubal || 0;

    // Build monthly data from aggregated results
    const incomeMap = new Map(monthlyIncomeData.map((d: any) => [d._id, d.total]));
    const expenseMap = new Map(monthlyExpenseData.map((d: any) => [d._id, d.total]));
    
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      
      monthlyData.push({
        name: monthLabel,
        income: incomeMap.get(key) || 0,
        expenses: expenseMap.get(key) || 0
      });
    }

    // Combine recent activity
    const activity = [
      ...recentIncome.map((i: any) => ({ type: 'income', ...i, title: i.description || 'Income' })),
      ...recentExpenses.map((e: any) => ({ type: 'expense', ...e, title: e.description || e.subType || 'Expense' }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return NextResponse.json({
      totalIncome,
      totalRubalIncome,
      totalExpenses,
      totalRubalExpenses,
      netBalance: totalIncome - totalExpenses,
      activeStudentsCount,
      monthlyData,
      recentActivity: activity
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
