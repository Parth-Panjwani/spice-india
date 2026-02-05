'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Plane, Banknote, Wallet, Pencil, Receipt, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TransactionForm from './TransactionForm';
import { format, isAfter, subMonths } from 'date-fns';

interface Props {
  category: any;
  entity: any;
  initialTransactions: any[];
}

export default function LedgerView({ category, entity, initialTransactions }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | '3M'>('3M'); 
  const router = useRouter();

  // Check if this is a staff category (case-insensitive)
  const isStaffCategory = category.name?.toLowerCase() === 'staff';

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    if (filter === 'ALL') return transactions;
    const cutoffDate = subMonths(new Date(), 3);
    return transactions.filter(t => isAfter(new Date(t.date), cutoffDate));
  }, [transactions, filter]);

  // Grouping Logic (only relevant for Staff)
  const breakdown = useMemo(() => {
    const setup = transactions.filter(t => ['Visa', 'Ticket'].includes(t.subType));
    const salary = transactions.filter(t => t.subType === 'Salary');
    const others = transactions.filter(t => !['Visa', 'Ticket', 'Salary'].includes(t.subType));

    const sum = (arr: any[]) => arr.reduce((acc, t) => acc + t.amount, 0);

    return {
      setup: { items: setup, total: sum(setup) },
      salary: { items: salary, total: sum(salary) },
      others: { items: others, total: sum(others) },
      grandTotal: sum(transactions)
    };
  }, [transactions]);

  const handleTransactionSaved = (savedTx: any) => {
    if (editingTransaction) {
      setTransactions(transactions.map(t => t._id === savedTx._id ? savedTx : t));
    } else {
      setTransactions([savedTx, ...transactions]);
    }
    closeModal();
    router.refresh();
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: any) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this expense?')) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions(transactions.filter(t => t._id !== id));
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
           <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10">
             <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
             <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">{entity.name}</h2>
             <p className="text-sm text-muted-foreground">{category.name} Expenses</p>
           </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
           {isStaffCategory && (
             <div className="hidden sm:flex bg-secondary/50 p-1 rounded-lg text-xs font-medium">
                <button onClick={() => setFilter('3M')} className={`px-3 py-1.5 rounded-md transition-all ${filter === '3M' ? 'bg-white text-orange-600 shadow-sm' : 'text-muted-foreground'}`}>3M</button>
                <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-md transition-all ${filter === 'ALL' ? 'bg-white text-orange-600 shadow-sm' : 'text-muted-foreground'}`}>All</button>
             </div>
           )}
           <Button onClick={openAddModal} className="h-10 bg-orange-600 hover:bg-orange-700 text-white shadow-md">
             <Plus className="mr-2 h-4 w-4" /> Add Expense
           </Button>
        </div>
      </div>

      {/* ========== STAFF CATEGORY VIEW ========== */}
      {isStaffCategory ? (
        <>
          {/* Staff Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-orange-50 border-orange-100 shadow-sm">
                <CardContent className="p-4 md:p-6">
                   <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 bg-orange-100 rounded-full text-orange-600"><Plane className="h-4 w-4" /></div>
                     <span className="text-xs md:text-sm font-semibold text-orange-900">Setup</span>
                   </div>
                   <div className="text-xl md:text-2xl font-bold text-orange-700">₹{breakdown.setup.total.toLocaleString()}</div>
                   <p className="text-[10px] md:text-xs text-orange-600/80">Visa + Tickets</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-100 shadow-sm">
                <CardContent className="p-4 md:p-6">
                   <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 bg-green-100 rounded-full text-green-600"><Banknote className="h-4 w-4" /></div>
                     <span className="text-xs md:text-sm font-semibold text-green-900">Salary</span>
                   </div>
                   <div className="text-xl md:text-2xl font-bold text-green-700">₹{breakdown.salary.total.toLocaleString()}</div>
                   <p className="text-[10px] md:text-xs text-green-600/80">Monthly Cost</p>
                </CardContent>
              </Card>

              <Card className="col-span-2 lg:col-span-1 bg-gray-900 border-gray-900 shadow-lg text-white">
                <CardContent className="p-4 md:p-6">
                   <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 bg-gray-700 rounded-full text-gray-200"><Wallet className="h-4 w-4" /></div>
                     <span className="text-xs md:text-sm font-semibold text-gray-100">Total Cost</span>
                   </div>
                   <div className="text-2xl md:text-3xl font-bold text-white">₹{breakdown.grandTotal.toLocaleString()}</div>
                   <p className="text-[10px] md:text-xs text-gray-400">All Expenses</p>
                </CardContent>
              </Card>
          </div>

          {/* Staff Breakdown Lists */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* Setup Breakdown */}
            <div className="space-y-2">
               <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                 <Plane className="h-4 w-4 text-orange-600" /> Visa & Travel
               </h3>
               <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {breakdown.setup.items.length > 0 ? (
                     breakdown.setup.items.map(t => (
                       <div key={t._id} onClick={() => openEditModal(t)} className="group flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer">
                          <div>
                             <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                               {t.subType}
                               <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                             </div>
                             <div className="text-xs text-muted-foreground">{format(new Date(t.date), 'dd MMM yyyy')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-bold text-orange-600">-₹{t.amount.toLocaleString()}</div>
                              {t.rubalAmount && <div className="text-[10px] text-gray-500 font-mono">≈ {t.rubalAmount.toFixed(0)} ₽</div>}
                            </div>
                            <button onClick={(e) => handleDeleteTransaction(t._id, e)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                          </div>
                       </div>
                     ))
                  ) : <div className="p-4 text-center text-muted-foreground text-xs">No setup costs</div>}
               </div>
            </div>

            {/* Salary Breakdown */}
            <div className="space-y-2">
               <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                 <Banknote className="h-4 w-4 text-green-600" /> Salary History
               </h3>
               <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {breakdown.salary.items.length > 0 ? (
                     breakdown.salary.items.map(t => (
                       <div key={t._id} onClick={() => openEditModal(t)} className="group flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer">
                          <div>
                             <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                Salary
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                             </div>
                             <div className="text-xs text-muted-foreground">{format(new Date(t.date), 'MMMM yyyy')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-bold text-green-600">-₹{t.amount.toLocaleString()}</div>
                              {t.rubalAmount && <div className="text-[10px] text-gray-500 font-mono">≈ {t.rubalAmount.toFixed(0)} ₽</div>}
                            </div>
                            <button onClick={(e) => handleDeleteTransaction(t._id, e)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                          </div>
                       </div>
                     ))
                  ) : <div className="p-4 text-center text-muted-foreground text-xs">No salary records</div>}
               </div>
            </div>
          </div>

          {/* Other Expenses (for Staff) */}
          {breakdown.others.items.length > 0 && (
             <div className="space-y-2">
               <h3 className="text-sm font-bold text-gray-800">Other Expenses</h3>
               <div className="bg-white rounded-xl border shadow-sm divide-y">
                   {breakdown.others.items.map(t => (
                      <div key={t._id} onClick={() => openEditModal(t)} className="group flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer">
                         <div>
                             <div className="font-medium text-sm flex items-center gap-2">
                               {t.subType || 'Expense'}
                               <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                             </div>
                             <div className="text-xs text-muted-foreground">{t.description || format(new Date(t.date), 'dd MMM yyyy')}</div>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="text-right">
                             <div className="font-bold text-gray-700">-₹{t.amount.toLocaleString()}</div>
                             {t.rubalAmount && <div className="text-[10px] text-gray-500 font-mono">≈ {t.rubalAmount.toFixed(0)} ₽</div>}
                           </div>
                           <button onClick={(e) => handleDeleteTransaction(t._id, e)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                         </div>
                      </div>
                   ))}
               </div>
             </div>
          )}
        </>
      ) : (
        /* ========== SIMPLE EXPENSE CATEGORY VIEW (Rent, Grocery, etc.) ========== */
        <>
          {/* Simple Total Card */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100 shadow-sm">
            <CardContent className="p-4 md:p-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 rounded-full text-red-600"><Receipt className="h-5 w-5" /></div>
                   <div>
                     <span className="text-sm font-semibold text-red-900">Total {category.name}</span>
                     <p className="text-xs text-red-600/80">{transactions.length} transactions</p>
                   </div>
                 </div>
                 <div className="text-2xl md:text-3xl font-bold text-red-700">₹{breakdown.grandTotal.toLocaleString()}</div>
               </div>
            </CardContent>
          </Card>

          {/* Simple Expense List */}
          <div className="bg-white rounded-xl border shadow-sm divide-y">
            {transactions.length > 0 ? (
              transactions.map(t => (
                <div 
                  key={t._id} 
                  onClick={() => openEditModal(t)} 
                  className="group flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                >
                   <div className="flex items-center gap-3">
                     <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                       <span className="text-red-600 font-bold text-sm">₹</span>
                     </div>
                     <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {t.description || t.subType || 'Expense'}
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                        <div className="text-xs text-muted-foreground">{format(new Date(t.date), 'dd MMM yyyy')}</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="text-right">
                       <div className="font-bold text-red-600">-₹{t.amount.toLocaleString()}</div>
                       {t.rubalAmount && <div className="text-[10px] text-gray-500 font-mono">≈ {t.rubalAmount.toFixed(0)} ₽</div>}
                     </div>
                     <button
                       onClick={(e) => handleDeleteTransaction(t._id, e)}
                       className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No expenses recorded for {entity.name} yet.
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-5 rounded-xl w-full max-w-md border shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{editingTransaction ? 'Edit Expense' : 'Add Expense'}</h3>
            <TransactionForm 
              categoryId={category._id}
              entityId={entity._id}
              onSuccess={handleTransactionSaved}
              onCancel={closeModal}
              initialData={editingTransaction}
              isSimpleCategory={!isStaffCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
}
