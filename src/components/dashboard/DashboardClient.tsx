'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  IndianRupee, 
  Users, 
  ShoppingBag,
  Send,
  CreditCard,
  AlertTriangle,
  Activity,
  ArrowRight
} from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Reset states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetCode, setResetCode] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
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
    if (resetCode !== "I CONFIRM DATA WIPE") {
        alert("Incorrect confirmation phrase.");
        return;
    }
    
    setResetting(true);
    try {
      const res = await fetch('/api/reset', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ confirmed: true })
      });
      if (res.ok) {
        alert("All financial and functional data has been permanently reset.");
        window.location.reload();
      } else {
        alert("Failed to reset data.");
      }
    } catch (err) {
      alert("Error resetting data.");
    } finally {
      setResetting(false);
      setResetDialogOpen(false);
      setResetCode('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.error) return <div className="p-8 text-center text-red-500">Failed to load dashboard data. {data?.error}</div>;
  
  if (!data.kpis) {
      console.error("Dashboard API returned malformed data:", data);
      return <div className="p-8 text-center text-red-500">Dashboard data is malformed. Please check the server logs.</div>;
  }

  const { kpis, metrics, alerts, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header & Reset Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
           <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Control Center</h2>
           <p className="text-sm text-muted-foreground mt-0.5">Real-time fraud prevention and meal tracking operations.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 h-9 shrink-0"
          onClick={() => setResetDialogOpen(true)}
        >
           <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Emergency Reset
        </Button>
      </div>

      {/* Global Alerts Panel */}
      {alerts && alerts.length > 0 && (
          <div className="space-y-2">
             {alerts.map((a: any, idx: number) => (
                 <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 text-sm font-medium ${
                     a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'
                 }`}>
                     <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                     <p>{a.message}</p>
                 </div>
             ))}
          </div>
      )}

      {/* Advanced KPIs Level 1 - India Tracking */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{kpis.totalIncomeINR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From Meal Contracts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Remitted</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">₹{kpis.totalRemittanceSentINR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Sent to Russia (≈ {kpis.totalRemittanceRecvRUB.toLocaleString()} RUB)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Contracts</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-gray-900">{kpis.activeMealStudents}</div>
             <p className="text-xs text-muted-foreground mt-1">Students to feed daily</p>
          </CardContent>
        </Card>
        
        <Card className={`shadow-sm border-0 ring-1 ring-black/5 ${Number(metrics.costPerStudentPerDay) > 400 ? 'bg-red-50' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cost / Student / Day</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-gray-900">{metrics.costPerStudentPerDay} RUB</div>
             <p className="text-xs text-muted-foreground mt-1">Rolling 30 days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced KPIs Level 2 - Russia Kitchen Tracking */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mt-2">Russia Operations</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
         <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invoiced Groceries</CardTitle>
            <ShoppingBag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis.totalGroceryPurchasesRUB.toLocaleString()} RUB</div>
            <p className="text-xs text-muted-foreground mt-1">Fully backed by receipts</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-0 ring-1 ring-black/5 ${metrics.procurementGapRUB > 50000 ? 'bg-orange-50' : (metrics.procurementGapRUB < 0 ? 'bg-red-50' : 'bg-white')}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Procurement Gap</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.procurementGapRUB < 0 ? 'text-red-500' : 'text-orange-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.procurementGapRUB.toLocaleString()} RUB</div>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Difference between grocery remittances received and actual invoiced purchases.</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Staff Payroll</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
                <div>
                   <div className="text-2xl font-bold text-gray-900">{kpis.totalSalaryPaidRUB.toLocaleString()} RUB</div>
                   <p className="text-xs text-muted-foreground mt-1 text-green-600">Total Paid (YTD)</p>
                </div>
                <div className="text-right">
                   <div className="text-lg font-bold text-red-600">{kpis.totalSalaryPendingRUB.toLocaleString()} RUB</div>
                   <p className="text-xs text-muted-foreground">Owed / Pending</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mt-2">Latest Operational Traces</h3>
      <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
          <CardContent className="p-0">
             <div className="divide-y divide-gray-100">
                {recentActivity.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">No operational activities logged yet.</div>
                ) : (
                    recentActivity.map((act: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                 act.type === 'remittance' ? 'bg-blue-100 text-blue-600' :
                                 act.type === 'purchase' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                              }`}>
                                 {act.type === 'remittance' ? <Send className="h-3.5 w-3.5" /> : 
                                  act.type === 'purchase' ? <ShoppingBag className="h-3.5 w-3.5" /> : 
                                  <Activity className="h-3.5 w-3.5" />}
                              </div>
                              <div>
                                 <p className="text-sm font-semibold text-gray-900">{act.title}</p>
                                 <p className="text-xs text-gray-500">
                                     {format(new Date(act.date), 'dd MMM yyyy, HH:mm')}
                                 </p>
                              </div>
                           </div>
                           <ArrowRight className="h-4 w-4 text-gray-300" />
                        </div>
                    ))
                )}
             </div>
          </CardContent>
      </Card>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
               <AlertTriangle className="h-5 w-5" /> Danger Zone WIPE
            </DialogTitle>
            <DialogDescription className="text-red-700 font-medium">
              This action will permanently delete all Students, Meal Contracts, Remittances, Inventory Purchases, and Staff Ledgers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
              <label className="text-xs font-semibold block mb-1">Type "I CONFIRM DATA WIPE" below:</label>
              <input 
                 className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm bg-gray-50"
                 placeholder="I CONFIRM DATA WIPE"
                 value={resetCode}
                 onChange={e => setResetCode(e.target.value)}
              />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetting}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetData} disabled={resetting || resetCode !== "I CONFIRM DATA WIPE"}>
               {resetting ? 'Wiping...' : 'Destroy All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
