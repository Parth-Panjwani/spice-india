'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  IndianRupee, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Wallet,
  ArrowRight
} from "lucide-react";
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/reset', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ confirmed: true })
      });
      if (res.ok) {
        alert("All data has been reset.");
        window.location.reload();
      } else {
        alert("Failed to reset data.");
      }
    } catch (err) {
      alert("Error resetting data.");
    } finally {
      setResetting(false);
      setResetDialogOpen(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>;
  }

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
           <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
           <p className="text-sm text-muted-foreground mt-0.5">Key metrics and activity.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 h-9"
          onClick={() => setResetDialogOpen(true)}
        >
           <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Reset Data
        </Button>
      </div>

      {/* KPI Cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Income</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
               <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">₹{data.totalIncome.toLocaleString()}</div>
            {data.totalRubalIncome > 0 && (
              <p className="text-xs text-orange-600 font-mono">≈ {Math.round(data.totalRubalIncome).toLocaleString()} RUB</p>
            )}
            <p className="text-xs text-green-600/80 mt-1">Lifetime Collections</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
             <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
               <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">₹{data.totalExpenses.toLocaleString()}</div>
            {data.totalRubalExpenses > 0 && (
              <p className="text-xs text-orange-600 font-mono">≈ {Math.round(data.totalRubalExpenses).toLocaleString()} RUB</p>
            )}
            <p className="text-xs text-red-600/80 mt-1">Lifetime Spend</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Net Balance</CardTitle>
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
               <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netBalance >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
              ₹{data.netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available Funds</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Students</CardTitle>
             <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
               <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{data.activeStudentsCount}</div>
            <p className="text-xs text-orange-600/80">Currently Enrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Activity - Stack on mobile */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Financial Overview</CardTitle>
            <CardDescription className="text-xs">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] md:h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6B7280" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${(value/1000)}k`} 
                      width={45}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Bar dataKey="income" name="Income" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={16} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and fees</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
             <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                   <div className="text-center text-sm text-gray-500 py-8">No recent activity</div>
                ) : (
                   data.recentActivity.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between pb-3 border-b border-dashed last:border-0 last:pb-0">
                         <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                               item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                               {item.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                               <p className="font-medium text-sm truncate max-w-[150px]">{item.title}</p>
                               <p className="text-xs text-muted-foreground">{format(new Date(item.date), 'dd MMM')}</p>
                            </div>
                         </div>
                         <div className={`font-semibold text-sm whitespace-nowrap ${
                            item.type === 'income' ? 'text-green-600' : 'text-red-600'
                         }`}>
                            {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
               <AlertTriangle className="h-5 w-5" /> Danger Zone
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL data (Students, Expenses, Income, History)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetting}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetData} disabled={resetting}>
               {resetting ? 'Resetting...' : 'Confirm Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
