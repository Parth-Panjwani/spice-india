'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, Wallet, CreditCard, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function StaffManager({ initialLedgers }: any) {
  const { role } = useAuth();
  const [ledgers, setLedgers] = useState([]);

  useEffect(() => {
    let filtered = initialLedgers || [];
    if (role === 'manager') {
       filtered = filtered.filter((l: any) => !l.staffName.toLowerCase().includes('manager'));
    } else if (role === 'cook') {
       filtered = filtered.filter((l: any) => l.staffName.toLowerCase().includes('cook'));
    }
    setLedgers(filtered);
  }, [initialLedgers, role]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<any>(null);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({ staffName: '', monthlySalaryRUB: '', setupCostOwedRUB: '' });
  const [updateForm, setUpdateForm] = useState({ addSalaryPaidTUB: '', addAdvanceRUB: '', addSetupCostPaidRUB: '', note: '' });
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (id: string) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openNew = () => {
    setEditingLedgerId(null);
    setForm({ staffName: '', monthlySalaryRUB: '', setupCostOwedRUB: '' });
    setIsNewModalOpen(true);
  };

  const openEdit = (l: any) => {
    setEditingLedgerId(l._id);
    setForm({
        staffName: l.staffName,
        monthlySalaryRUB: l.monthlySalaryRUB.toString(),
        setupCostOwedRUB: l.setupCostOwedRUB ? l.setupCostOwedRUB.toString() : ''
    });
    setIsNewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this staff member and all their ledger history?")) return;
    try {
        const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
        if(res.ok) {
            setLedgers(ledgers.filter((l: any) => l._id !== id));
            router.refresh();
        }
    } catch(err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingLedgerId ? `/api/staff/${editingLedgerId}` : '/api/staff';
      const method = editingLedgerId ? 'PUT' : 'POST';
      const payload = {
           staffName: form.staffName,
           monthlySalaryRUB: Number(form.monthlySalaryRUB),
           ...(form.setupCostOwedRUB && { setupCostOwedRUB: Number(form.setupCostOwedRUB) })
      };

      const res = await fetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        setIsNewModalOpen(false);
        router.refresh();
      }
    } finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${selectedLedger._id}`, {
         method: 'PUT',
         body: JSON.stringify({
            addSalaryPaidTUB: updateForm.addSalaryPaidTUB ? Number(updateForm.addSalaryPaidTUB) : 0,
            addAdvanceRUB: updateForm.addAdvanceRUB ? Number(updateForm.addAdvanceRUB) : 0,
            addSetupCostPaidRUB: updateForm.addSetupCostPaidRUB ? Number(updateForm.addSetupCostPaidRUB) : 0,
            note: updateForm.note
         })
      });
      if (res.ok) {
         setIsUpdateModalOpen(false);
         setUpdateForm({ addSalaryPaidTUB: '', addAdvanceRUB: '', addSetupCostPaidRUB: '', note: '' });
         router.refresh();
      }
    } finally { setLoading(false); }
  };

  const openUpdate = (l: any) => {
      setSelectedLedger(l);
      setIsUpdateModalOpen(true);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
           <div className="flex gap-4">
              <Card className="px-4 py-2 bg-white shadow-sm flex items-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Users className="h-4 w-4" /></div>
                 <div>
                    <p className="text-xs text-muted-foreground uppercase">Total Staff</p>
                    <p className="font-bold text-gray-900">{ledgers.length}</p>
                 </div>
              </Card>
           </div>
           
           <div className="flex items-center justify-between w-full sm:w-auto">
               <h2 className="text-lg font-bold sm:hidden">Staff Ledgers</h2>
               {role === 'admin' && (
                 <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add Staff Member
                 </Button>
               )}
           </div>
       </div>

       <h2 className="text-lg font-bold hidden sm:block mt-2">Staff Ledgers</h2>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
           {ledgers.map((l: any) => {
               const balance = l.monthlySalaryRUB - ((l.salaryPaidRUB || 0) + (l.advancesRUB || 0) + (l.setupCostPaidRUB || 0));
               const setupOwedRemaining = (l.setupCostOwedRUB || 0) - (l.setupCostPaidRUB || 0);

               return (
                  <Card key={l._id} className="shadow-sm border-0 ring-1 ring-black/5 bg-white relative overflow-hidden">
                      <div className={`absolute left-0 top-0 h-full w-1.5 ${balance > 0 ? 'bg-red-400' : 'bg-green-400'}`} />
                      <CardContent className="p-5 pl-6">
                          <h3 className="font-bold text-lg text-gray-900 flex justify-between items-center group">
                             {l.staffName}
                             {role === 'admin' && (
                               <div className="flex items-center gap-1">
                                   <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(l)}>
                                       <Edit className="h-3.5 w-3.5" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(l._id)}>
                                       <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                               </div>
                             )}
                             {role !== 'cook' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs ml-1 bg-white hover:bg-gray-50" onClick={() => openUpdate(l)}>Update Pay</Button>
                             )}
                          </h3>
                          
                          <div className="mt-4 space-y-2 text-sm">
                              <div className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                                 <span className="text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5"/> Monthly Rate</span>
                                 <span className="font-medium">{l.monthlySalaryRUB.toLocaleString()} ₽</span>
                              </div>
                              <div className="flex justify-between items-center px-2 py-1">
                                 <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5"/> Salary Paid (YTD)</span>
                                 <span className="font-medium text-green-600">{(l.salaryPaidRUB || 0).toLocaleString()} ₽</span>
                              </div>
                              <div className="flex justify-between items-center px-2 py-1">
                                 <span className="text-muted-foreground flex items-center gap-1.5"> Advances</span>
                                 <span className="font-medium text-orange-600">{(l.advancesRUB || 0).toLocaleString()} ₽</span>
                              </div>

                              {/* Visa & Tickets Block */}
                              {(l.setupCostOwedRUB > 0) && (
                                  <div className="bg-orange-50 rounded p-2 text-[11px] mt-2 border border-orange-100">
                                      <div className="flex justify-between items-center text-orange-900 font-semibold mb-1">
                                          <span>Visa & Tickets (Setup Costs)</span>
                                      </div>
                                      <div className="flex justify-between text-orange-800">
                                          <span>Total Cost:</span>
                                          <span>{l.setupCostOwedRUB.toLocaleString()} ₽</span>
                                      </div>
                                      <div className="flex justify-between text-orange-800">
                                          <span>Recovered from Salary:</span>
                                          <span>{l.setupCostPaidRUB.toLocaleString()} ₽</span>
                                      </div>
                                      <div className="flex justify-between text-orange-900 font-bold mt-1 pt-1 border-t border-orange-200">
                                          <span>Pending Recovery:</span>
                                          <span>{setupOwedRemaining.toLocaleString()} ₽</span>
                                      </div>
                                  </div>
                              )}

                              <div className="pt-2 mt-2 border-t border-dashed flex justify-between items-center px-2">
                                 <span className="font-bold text-gray-900">Pending Salary Balance</span>
                                 <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{balance.toLocaleString()} ₽</span>
                              </div>
                              
                              {/* Payment History Toggle */}
                              {(l.history && l.history.length > 0) && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                   <button 
                                     onClick={() => toggleHistory(l._id)}
                                     className="text-xs font-semibold text-blue-600 hover:text-blue-800 w-full text-left flex justify-between items-center bg-gray-50/50 p-2 rounded"
                                   >
                                     View Payment History ({l.history.length} records)
                                     <span>{expandedHistory[l._id] ? '▲' : '▼'}</span>
                                   </button>
                                   
                                   {expandedHistory[l._id] && (
                                       <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                                           {l.history.slice().reverse().map((record: any, idx: number) => (
                                               <div key={idx} className="bg-gray-50 border border-gray-100 p-2 rounded text-[11px]">
                                                   <div className="flex justify-between font-semibold text-gray-800 mb-0.5">
                                                      <span>
                                                          {record.type === 'salary_paid' ? '💰 Salary Payment' : 
                                                           record.type === 'advance_issued' ? '💸 Advance Issued' : 
                                                           '🛂 Visa/Ticket Recovery'}
                                                      </span>
                                                      <span className={record.type === 'setup_recovered' ? 'text-orange-600' : 'text-green-600'}>
                                                          {record.amount.toLocaleString()} ₽
                                                      </span>
                                                   </div>
                                                   <div className="flex justify-between text-muted-foreground">
                                                      <span>{new Date(record.date).toLocaleDateString()}</span>
                                                      {record.note && <span className="italic">Note: {record.note}</span>}
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                                </div>
                              )}
                          </div>
                      </CardContent>
                  </Card>
               );
           })}
           {ledgers.length === 0 && <p className="text-muted-foreground col-span-full py-8 text-center text-sm border-2 border-dashed rounded-xl">No staff ledgers found.</p>}
       </div>

       <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>{editingLedgerId ? 'Edit Staff Profile' : 'Add New Staff Ledger'}</DialogTitle></DialogHeader>
             <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Staff Name" value={form.staffName} onChange={e => setForm({...form, staffName: e.target.value})} required/>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" placeholder="Monthly Salary (RUB)" value={form.monthlySalaryRUB} onChange={e => setForm({...form, monthlySalaryRUB: e.target.value})} required/>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Upfront Visa & Ticket Cost (RUB)</label>
                    <p className="text-[10px] text-muted-foreground mb-2">If you paid for their setup, enter it here. This debt will be tracked and you can recover it from their salary later.</p>
                    <input className="flex h-9 w-full rounded-md border text-sm px-3 bg-white" type="number" placeholder="e.g. 85000" value={form.setupCostOwedRUB} onChange={e => setForm({...form, setupCostOwedRUB: e.target.value})} disabled={!!editingLedgerId} />
                    {editingLedgerId && <p className="text-[10px] text-orange-600 mt-1">Setup Cost Owed cannot be edited once initialized. Delete and recreate if needed.</p>}
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600">{editingLedgerId ? 'Update Staff Member' : 'Create Ledger'}</Button>
             </form>
          </DialogContent>
       </Dialog>

       <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>Update Pay: {selectedLedger?.staffName}</DialogTitle></DialogHeader>
             <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-900">
                    Entering an amount here will <strong>add</strong> to their existing totals. Tip: Create a <span className="font-bold">Remittance</span> labeled "Salary" before paying this out.
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-700 block mb-1">Send Next Salary Payment (RUB)</label>
                   <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" placeholder="e.g. 5000" value={updateForm.addSalaryPaidTUB} onChange={e => setUpdateForm({...updateForm, addSalaryPaidTUB: e.target.value})} />
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-700 block mb-1">Issue Specific Advance (RUB)</label>
                   <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" placeholder="e.g. 1000" value={updateForm.addAdvanceRUB} onChange={e => setUpdateForm({...updateForm, addAdvanceRUB: e.target.value})} />
                </div>

                {(selectedLedger?.setupCostOwedRUB > 0) && (
                    <div className="bg-orange-50 p-3 rounded-md border border-orange-200 mt-4">
                       <label className="text-xs font-bold text-orange-900 block mb-1">Recover Visa/Ticket Debt (RUB)</label>
                       <p className="text-[10px] text-orange-800 mb-2 leading-tight">Deducting this from their Pending Salary will mark their Visa debt as returned to the business.</p>
                       <input className="flex h-9 w-full rounded-md border-orange-300 text-sm px-3 bg-white focus:ring-orange-500" type="number" placeholder="e.g. 10000" value={updateForm.addSetupCostPaidRUB} onChange={e => setUpdateForm({...updateForm, addSetupCostPaidRUB: e.target.value})} />
                    </div>
                )}

                <div className="mt-4">
                   <label className="text-xs font-semibold text-gray-700 block mb-1">Transaction Note (Optional)</label>
                   <input className="flex h-9 w-full rounded-md border text-sm px-3" type="text" placeholder="e.g. May Salary + Bonus" value={updateForm.note} onChange={e => setUpdateForm({...updateForm, note: e.target.value})} />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full bg-green-600 mt-6">Apply Adjustments</Button>
             </form>
          </DialogContent>
       </Dialog>
    </div>
  );
}
