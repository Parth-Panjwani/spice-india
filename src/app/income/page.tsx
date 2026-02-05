import connectToDatabase from '@/lib/db';
import Income from '@/models/Income';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IndianRupee, Users } from 'lucide-react';
import IncomeList from '@/components/income/IncomeList';

export const dynamic = 'force-dynamic';

async function getIncomeData() {
  await connectToDatabase();
  const incomes = await Income.find({})
    .populate('student', 'fullName studentId course')
    .sort({ date: -1 })
    .lean();
  
  const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  
  return {
    incomes: JSON.parse(JSON.stringify(incomes)),
    total
  };
}

export default async function IncomePage() {
  const { incomes, total } = await getIncomeData();

  return (
    <div className="space-y-4 md:space-y-6">
       <div>
         <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Income</h2>
         <p className="text-sm text-muted-foreground">Track Fees & Payments</p>
       </div>

       <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Card className="bg-green-50 border-green-100">
             <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
               <CardTitle className="text-xs md:text-sm font-medium text-green-700">Total Revenue</CardTitle>
               <IndianRupee className="h-4 w-4 text-green-600" />
             </CardHeader>
             <CardContent className="pt-0">
                <div className="text-xl md:text-2xl font-bold text-green-800">₹{total.toLocaleString()}</div>
                <p className="text-[10px] md:text-xs text-green-600/80">Lifetime</p>
             </CardContent>
          </Card>
          
          <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
               <CardTitle className="text-xs md:text-sm font-medium">Payments</CardTitle>
               <Users className="h-4 w-4 text-gray-500" />
             </CardHeader>
             <CardContent className="pt-0">
                <div className="text-xl md:text-2xl font-bold">{incomes.length}</div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
             </CardContent>
          </Card>
       </div>

       <Card className="border-gray-100">
          <CardHeader className="pb-3">
             <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
             <IncomeList initialIncomes={incomes} />
          </CardContent>
       </Card>
    </div>
  );
}
