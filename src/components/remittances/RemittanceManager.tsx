'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Upload, Download, Eye, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function RemittanceManager({ initialRemittances }: { initialRemittances: any[] }) {
  const [remittances, setRemittances] = useState(initialRemittances);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    amountINR: '',
    rubalRate: '',
    sentTo: '',
    purpose: 'Groceries',
    notes: '',
    proofImageUrl: '',
    date: new Date().toISOString().split('T')[0]
  });

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
      const res = await fetch('/api/remittances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           amountINR: Number(formData.amountINR),
           rubalRate: Number(formData.rubalRate),
           sentTo: formData.sentTo,
           purpose: formData.purpose,
           date: new Date(formData.date).toISOString(),
           proofImageUrl: formData.proofImageUrl,
           notes: formData.notes
        })
      });

      if (res.ok) {
        const newRemittance = await res.json();
        setRemittances([newRemittance, ...remittances]);
        setIsModalOpen(false);
        setFormData({
            amountINR: '', rubalRate: '', sentTo: '', purpose: 'Groceries', notes: '', proofImageUrl: '', date: new Date().toISOString().split('T')[0]
        });
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

  return (
    <div>
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
           
           <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Remittance
           </Button>
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
                                            <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => markConfirmed(rem._id)}>Mark Confirm</Button>
                                         )}
                                         
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-orange-600" onClick={() => setPreviewImage(rem.proofImageUrl)}>
                                             <Eye className="h-3.5 w-3.5" />
                                         </Button>
                                     </div>
                                 </td>
                             </tr>
                         ))}
                         {remittances.length === 0 && (
                             <tr>
                                 <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground bg-white">
                                     No remittances logged yet.
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
                                   <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wide border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100" onClick={() => markConfirmed(rem._id)}>Approve</Button>
                                )}
                             </div>
                             <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 flex items-center gap-1 hover:bg-gray-100 font-semibold" onClick={() => setPreviewImage(rem.proofImageUrl)}>
                                 <Eye className="h-4 w-4" /> Proof
                             </Button>
                         </div>
                     </div>
                 ))}
                 {remittances.length === 0 && (
                     <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                         No remittances logged yet.
                     </div>
                 )}
             </div>
          </CardContent>
       </Card>

       {/* Add Modal */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle>Log New Remittance</DialogTitle>
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
                   <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">Save Transfer</Button>
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
    </div>
  );
}
