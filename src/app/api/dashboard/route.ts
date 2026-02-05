import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import Transaction from '@/models/Transaction';
import Student from '@/models/Student';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Total Income
    const incomeResult = await Income.aggregate([
       { $group: { _id: null, total: { $sum: '$amount' }, totalRubal: { $sum: '$rubalAmount' } } }
    ]);
    const totalIncome = incomeResult[0]?.total || 0;
    const totalRubalIncome = incomeResult[0]?.totalRubal || 0;

    // 2. Total Expenses
    const expenseResult = await Transaction.aggregate([
       { $group: { _id: null, total: { $sum: '$amount' }, totalRubal: { $sum: '$rubalAmount' } } }
    ]);
    const totalExpenses = expenseResult[0]?.total || 0;
    const totalRubalExpenses = expenseResult[0]?.totalRubal || 0;

    // 3. Active Students
    const activeStudentsCount = await Student.countDocuments({ status: 'active' });

    // 4. Monthly Data (Last 6 Months) for Chart
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
       const date = subMonths(new Date(), i);
       const monthStart = startOfMonth(date);
       const monthEnd = endOfMonth(date);
       const monthLabel = date.toLocaleString('default', { month: 'short' });

        const monthIncome = await Income.aggregate([
            { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const monthExpense = await Transaction.aggregate([
            { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        monthlyData.push({
            name: monthLabel,
            income: monthIncome[0]?.total || 0,
            expenses: monthExpense[0]?.total || 0
        });
    }

    // 5. Recent Activity (Last 5 combined)
    // We fetch 5 of each, combine, sort, take 5. 
    // Ideally we'd use a union query but schemas differ.
    const recentIncome = await Income.find().sort({ date: -1 }).limit(5).lean();
    const recentExpenses = await Transaction.find().sort({ date: -1 }).limit(5).lean();

    const activity = [
        ...recentIncome.map(i => ({ type: 'income', ...i, title: i.description || 'Income' })),
        ...recentExpenses.map(e => ({ type: 'expense', ...e, title: e.description || 'Expense' }))
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
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
