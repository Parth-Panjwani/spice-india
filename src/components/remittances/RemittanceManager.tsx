'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Upload, Download, Eye, FileText, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function RemittanceManager({ initialRemittances, initialRequests = [] }: { initialRemittances: any[], initialRequests?: any[] }) {
  const { role } = useAuth();
  const [remittances, setRemittances] = useState(initialRemittances);
  const [requests, setRequests] = useState(initialRequests);

  useEffect(() => {
    setRemittances(initialRemittances);
    setRequests(initialRequests);
  }, [initialRemittances, initialRequests]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const defaultForm = {
    amountINR: '',
    rubalRate: '',
    sentTo: '',
    purpose: 'Groceries',
    notes: '',
    proofImageUrl: '',
    date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(defaultForm);

  const defaultRequestForm = {
    amountRUB: '',
    purpose: '',
    notes: '',
  };
  const [requestForm, setRequestForm] = useState(defaultRequestForm);

  const openNewModal = () => {
      setEditingId(null);
      setFormData(defaultForm);
      setIsModalOpen(true);
  };

  const openNewRequestModal = () => {
      setRequestForm(defaultRequestForm);
      setIsRequestModalOpen(true);
  };

  const openEditModal = (rem: any) => {
      setEditingId(rem._id);
      setFormData({
          amountINR: rem.amountINR.toString(),
          rubalRate: rem.rubalRate.toString(),
          sentTo: rem.sentTo,
          purpose: rem.purpose,
          notes: rem.notes || '',
          proofImageUrl: rem.proofImageUrl,
          date: rem.date ? new Date(rem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this money transfer? This cannot be undone.")) return;
      try {
          const res = await fetch(`/api/remittances/${id}`, { method: 'DELETE' });
          if(res.ok) {
              setRemittances(remittances.filter(r => r._id !== id));
              router.refresh();
          }
      } catch (err) {
          console.error(err);
      }
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, proofImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amountINR || !formData.rubalRate || !formData.proofImageUrl) {
        alert("Amount, Rate, and Proof Image are mandatory.");
        return;
    }

    setLoading(true);
    try {
      const payload = {
           amountINR: Number(formData.amountINR),
           rubalRate: Number(formData.rubalRate),
           amountRUB: Number(formData.amountINR) * Number(formData.rubalRate),
           sentTo: formData.sentTo,
           purpose: formData.purpose,
           date: new Date(formData.date).toISOString(),
           proofImageUrl: formData.proofImageUrl,
           notes: formData.notes
      };

      const url = editingId ? `/api/remittances/${editingId}` : '/api/remittances';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedRemittance = await res.json();
        if (editingId) {
            setRemittances(remittances.map(r => r._id === editingId ? savedRemittance : r));
        } else {
            setRemittances([savedRemittance, ...remittances]);
        }
        setIsModalOpen(false);
        setFormData(defaultForm);
        setEditingId(null);
        router.refresh();
      } else {
        alert("Failed to save remittance.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving remittance.");
    } finally {
      setLoading(false);
    }
  };

  const markConfirmed = async (id: string) => {
      try {
          const res = await fetch(`/api/remittances/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'confirmed' })
          });
          if(res.ok) {
              setRemittances(remittances.map(r => r._id === id ? { ...r, status: 'confirmed' } : r));
              router.refresh();
          }
      } catch (err) {
          console.error(err);
      }
  };

  const submitFundRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
         const res = await fetch('/api/fund-requests', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 amountRUB: Number(requestForm.amountRUB),
                 purpose: requestForm.purpose,
                 notes: requestForm.notes,
                 requestedBy: 'manager' // This could be dynamically fetched based on logged in user later
             })
         });
         if(res.ok) {
            setIsRequestModalOpen(false);
            setRequestForm(defaultRequestForm);
            router.refresh();
         }
      } finally { setLoading(false); }
  };

  const updateRequestStatus = async (id: string, status: string) => {
      setLoading(true);
      try {
         const res = await fetch(`/api/fund-requests/${id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ status })
         });
         if(res.ok) router.refresh();
      } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
       <Tabs defaultValue={role === 'manager' ? 'requests' : 'sent'} className="space-y-4">
          <TabsList className={`w-full flex justify-start bg-white border rounded-lg h-auto p-1 gap-1 whitespace-nowrap overflow-x-auto ${role === 'manager' ? 'hidden' : ''}`}>
             {role === 'admin' && (
               <TabsTrigger value="sent" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Sent Transfers</TabsTrigger>
             )}
             <TabsTrigger value="requests" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Fund Requests</TabsTrigger>
          </TabsList>

          {role === 'admin' && (
            <TabsContent value="sent">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
           <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-2 w-full sm:w-auto">
              <Card className="px-3 py-2 bg-white shadow-sm border-gray-100 flex items-center gap-2">
                 <div className="bg-orange-100 p-2 rounded-full text-orange-600 flex-shrink-0"><Download className="h-4 w-4" /></div>
                 <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase leading-tight truncate">Total INR Sent</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base truncate">₹{remittances.reduce((sum, r) => sum + r.amountINR, 0).toLocaleString()}</p>
                 </div>
              </Card>
              <Card className="px-3 py-2 bg-white shadow-sm border-gray-100 flex items-center gap-2">
                 <div className="bg-blue-100 p-2 rounded-full text-blue-600 flex-shrink-0"><FileText className="h-4 w-4" /></div>
                 <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase leading-tight truncate">Total RUB Recv</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{remittances.reduce((sum, r) => sum + r.amountRUB, 0).toLocaleString()} ₽</p>
                 </div>
              </Card>
           </div>
           
           {role === 'admin' && (
             <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto" onClick={openNewModal}>
                <Plus className="mr-2 h-4 w-4" /> New Transfer
             </Button>
           )}
       </div>

       <Card className="shadow-sm border-0 ring-1 ring-black/5">
          <CardContent className="p-0 bg-transparent sm:bg-white">
             {/* Desktop Table View */}
             <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-sm text-left min-w-[600px]">
                     <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                         <tr>
                             <th className="px-4 py-3 font-medium">Date</th>
                             <th className="px-4 py-3 font-medium">To / Purpose</th>
                             <th className="px-4 py-3 font-medium">Amount sent (₹)</th>
                             <th className="px-4 py-3 font-medium">Rate</th>
                             <th className="px-4 py-3 font-medium">Received (₽)</th>
                             <th className="px-4 py-3 font-medium">Status / Proof</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 bg-white">
                         {remittances.map((rem) => (
                             <tr key={rem._id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                     {format(new Date(rem.date), 'dd MMM yyyy')}
                                 </td>
                                 <td className="px-4 py-3">
                                     <div className="font-medium text-gray-900">{rem.sentTo}</div>
                                     <div className="text-xs text-muted-foreground">{rem.purpose}</div>
                                 </td>
                                 <td className="px-4 py-3 font-bold text-gray-700">₹{rem.amountINR.toLocaleString()}</td>
                                 <td className="px-4 py-3 text-muted-foreground">{rem.rubalRate}</td>
                                 <td className="px-4 py-3 font-bold text-blue-700">{Math.round(rem.amountRUB).toLocaleString()} ₽</td>
                                 <td className="px-4 py-3">
                                     <div className="flex items-center gap-2">
                                         {rem.status === 'confirmed' ? (
                                             <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Confirmed
                                             </span>
                                         ) : (
                                             role === 'admin' ? (
                                                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => markConfirmed(rem._id)}>Mark Confirm</Button>
                                             ) : (
                                                <span className="text-xs font-medium text-orange-600">Pending</span>
                                             )
                                         )}
                                         
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-orange-600" onClick={() => setPreviewImage(rem.proofImageUrl)}>
                                             <Eye className="h-3.5 w-3.5" />
                                         </Button>

                                         {role === 'admin' && (
                                           <>
                                             <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => openEditModal(rem)}>
                                                 <Edit className="h-3.5 w-3.5" />
                                             </Button>
                                             <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => handleDelete(rem._id)}>
                                                 <Trash2 className="h-3.5 w-3.5" />
                                             </Button>
                                           </>
                                         )}
                                     </div>
                                 </td>
                             </tr>
                         ))}
                         {remittances.length === 0 && (
                             <tr>
                                 <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground bg-white">
                                     No money transfers logged yet.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>

             {/* Mobile Card View */}
             <div className="md:hidden flex flex-col gap-3 select-none">
                 {remittances.map((rem) => (
                     <div key={rem._id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(rem.date), 'dd MMM yyyy')}</div>
                                 <div className="font-bold text-gray-900 mt-0.5 text-base">{rem.sentTo}</div>
                                 <div className="text-xs text-orange-600 font-medium">{rem.purpose}</div>
                             </div>
                             <div className="text-right">
                                 <div className="font-black text-blue-700 text-lg">{Math.round(rem.amountRUB).toLocaleString()} ₽</div>
                                 <div className="text-xs text-muted-foreground mt-0.5 font-medium">₹{rem.amountINR.toLocaleString()} @ {rem.rubalRate}</div>
                             </div>
                         </div>
                         <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                             <div>
                                {rem.status === 'confirmed' ? (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 uppercase">
                                       <CheckCircle className="h-3 w-3" /> Confirmed
                                    </span>
                                ) : (
                                    role === 'admin' ? (
                                       <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wide border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100" onClick={() => markConfirmed(rem._id)}>Approve</Button>
                                    ) : (
                                       <span className="text-[10px] font-bold text-orange-600 uppercase">Pending</span>
                                    )
                                )}
                             </div>
                             <div className="flex items-center gap-1">
                                 {role === 'admin' && (
                                   <>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 bg-gray-50" onClick={() => openEditModal(rem)}>
                                         <Edit className="h-3.5 w-3.5" />
                                     </Button>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 bg-gray-50" onClick={() => handleDelete(rem._id)}>
                                         <Trash2 className="h-3.5 w-3.5" />
                                     </Button>
                                   </>
                                 )}
                                 <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 font-semibold px-2" onClick={() => setPreviewImage(rem.proofImageUrl)}>
                                     <Eye className="h-3.5 w-3.5" /> Proof
                                 </Button>
                             </div>
                         </div>
                     </div>
                 ))}
                 {remittances.length === 0 && (
                     <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                         No money transfers logged yet.
                     </div>
                 )}
             </div>
          </CardContent>
       </Card>
      </TabsContent>
          )}

      <TabsContent value="requests">
         <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold">Manager Fund Requests</h2>
             <Button className="bg-orange-600 hover:bg-orange-700" onClick={openNewRequestModal}>
                <Plus className="mr-2 h-4 w-4" /> Request Funds
             </Button>
         </div>

         <div className="grid gap-3">
             {requests.map((req: any) => (
                 <Card key={req._id} className="p-4 shadow-sm">
                     <div className="flex justify-between items-start">
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <h3 className="font-bold text-gray-900 text-lg">{req.amountRUB.toLocaleString()} ₽</h3>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : req.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                     {req.status}
                                 </span>
                             </div>
                             <p className="text-sm font-medium text-gray-700">{req.purpose}</p>
                             {req.notes && <p className="text-xs text-muted-foreground mt-1">"{req.notes}"</p>}
                             <p className="text-[10px] text-muted-foreground mt-2">Requested by {req.requestedBy} on {format(new Date(req.dateRequested), 'dd MMM yyyy')}</p>
                         </div>
                         
                         {role === 'admin' && req.status === 'pending' && (
                             <div className="flex flex-col gap-2">
                                 <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateRequestStatus(req._id, 'approved')}>Approve</Button>
                                 <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => updateRequestStatus(req._id, 'rejected')}>Reject</Button>
                             </div>
                         )}
                         {role === 'admin' && req.status === 'approved' && (
                             <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => updateRequestStatus(req._id, 'fulfilled')}>Mark Fulfilled</Button>
                         )}
                     </div>
                 </Card>
             ))}
             {requests.length === 0 && (
                 <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                     No fund requests found.
                 </div>
             )}
         </div>
      </TabsContent>
    </Tabs>

       {/* Add Modal */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle>{editingId ? 'Edit Transfer' : 'Log New Transfer'}</DialogTitle>
                 <DialogDescription>Record money sent to Russia.</DialogDescription>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 uppercase">Amount (INR)</label>
                        <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" type="number" value={formData.amountINR} onChange={e => setFormData({...formData, amountINR: e.target.value})} placeholder="e.g. 50000" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 uppercase">Rate</label>
                        <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" type="number" step="0.01" value={formData.rubalRate} onChange={e => setFormData({...formData, rubalRate: e.target.value})} placeholder="e.g. 0.92" required />
                    </div>
                </div>

                {formData.amountINR && formData.rubalRate && (
                   <div className="bg-blue-50 text-blue-800 p-2 rounded text-sm text-center font-bold">
                       Will Receive: {(Number(formData.amountINR) * Number(formData.rubalRate)).toLocaleString()} ₽
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase">Sent To</label>
                      <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" value={formData.sentTo} onChange={e => setFormData({...formData, sentTo: e.target.value})} placeholder="e.g. Sberbank Name" required />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase">Purpose</label>
                      <select className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm bg-white" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
                          <option value="Groceries">Groceries</option>
                          <option value="Salary">Salary</option>
                          <option value="Advance">Advance</option>
                          <option value="Emergency">Emergency</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-700 uppercase">Date</label>
                   <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-700 uppercase">Transfer Proof (Mandatory)</label>
                   <div className="flex items-center gap-2 border border-dashed rounded-md p-2">
                       <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="proof-upload" />
                       <label htmlFor="proof-upload" className="cursor-pointer flex items-center gap-2 py-1 px-3 bg-gray-100 hover:bg-gray-200 border rounded text-xs font-medium transition-colors">
                          <Upload className="h-3 w-3" /> Upload Receipt
                       </label>
                       {formData.proofImageUrl && <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>}
                   </div>
                </div>

                <DialogFooter className="pt-2">
                   <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">{editingId ? 'Update Transfer' : 'Save Transfer'}</Button>
                </DialogFooter>
             </form>
          </DialogContent>
       </Dialog>

       {/* Image Preview Modal */}
       <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
           <DialogContent className="sm:max-w-2xl">
               <DialogHeader>
                   <DialogTitle>Transfer Proof</DialogTitle>
               </DialogHeader>
               <div className="flex justify-center bg-gray-50 flex-1 min-h-[300px] rounded-lg overflow-hidden border">
                   {previewImage && <img src={previewImage} alt="Proof" className="max-h-[70vh] object-contain" />}
               </div>
           </DialogContent>
       </Dialog>

       {/* Request Funds Modal */}
       <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle>Request Funds</DialogTitle>
                 <DialogDescription>Ask Admin to send money for operations.</DialogDescription>
             </DialogHeader>
             <form onSubmit={submitFundRequest} className="space-y-4 py-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Amount Needed (RUB)</label>
                    <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" type="number" value={requestForm.amountRUB} onChange={e => setRequestForm({...requestForm, amountRUB: e.target.value})} placeholder="e.g. 150000" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Purpose</label>
                    <input className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm" value={requestForm.purpose} onChange={e => setRequestForm({...requestForm, purpose: e.target.value})} placeholder="e.g. Next Month Rent + Staff Setup" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Additional Notes</label>
                    <textarea className="flex w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm" rows={3} value={requestForm.notes} onChange={e => setRequestForm({...requestForm, notes: e.target.value})} placeholder="Provide breakdown if needed..." />
                </div>
                <DialogFooter className="pt-2">
                   <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
                   <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">Submit Request</Button>
                </DialogFooter>
             </form>
          </DialogContent>
       </Dialog>
    </div>
  );
}
