'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Upload, Eye, FileText, AlertTriangle, Package, Activity, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function InventoryManager({ initialItems, initialPurchases, initialConsumptions, remittances }: any) {
  const [items, setItems] = useState(initialItems);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [consumptions, setConsumptions] = useState(initialConsumptions);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form States
  const [itemForm, setItemForm] = useState({ name: '', unit: '', minimumThreshold: 5 });
  const [purchaseForm, setPurchaseForm] = useState({ itemRef: '', quantity: '', priceRUB: '', purchasedBy: '', linkedRemittance: '', invoiceImage: '' });
  const [consumptionForm, setConsumptionForm] = useState({ itemRef: '', quantityUsed: '', loggedBy: '', notes: '' });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPurchaseForm({ ...purchaseForm, invoiceImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/items', { method: 'POST', body: JSON.stringify(itemForm) });
      if (res.ok) {
        const newItem = await res.json();
        setItems([...items, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        setIsItemModalOpen(false);
        setItemForm({ name: '', unit: '', minimumThreshold: 5 });
        router.refresh();
      }
    } finally { setLoading(false); }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.invoiceImage || !purchaseForm.linkedRemittance) {
        alert("Invoice image and a linked Remittance are strictly required.");
        return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/purchases', { method: 'POST', body: JSON.stringify({...purchaseForm, quantity: Number(purchaseForm.quantity), priceRUB: Number(purchaseForm.priceRUB)}) });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        window.location.reload(); // Hard reload to update all populated refs
      } else {
        alert('Failed to save purchase');
      }
    } finally { setLoading(false); }
  };

  const handleCreateConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/consumptions', { method: 'POST', body: JSON.stringify({...consumptionForm, quantityUsed: Number(consumptionForm.quantityUsed)}) });
      if (res.ok) {
        setIsConsumptionModalOpen(false);
        window.location.reload(); 
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
       <Tabs defaultValue="stock" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto justify-start bg-white border rounded-lg h-auto p-1 gap-1 whitespace-nowrap">
             <TabsTrigger value="stock" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Live Stock</TabsTrigger>
             <TabsTrigger value="purchases" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Grocery Purchases</TabsTrigger>
             <TabsTrigger value="consumptions" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Daily Consumption</TabsTrigger>
          </TabsList>

          {/* STOCK TAB */}
          <TabsContent value="stock">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                 <h2 className="text-lg font-bold">Kitchen Stock</h2>
                 <Button size="sm" onClick={() => setIsItemModalOpen(true)} className="bg-orange-600 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/> New Material</Button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {items.map((item: any) => (
                    <Card key={item._id} className={`shadow-sm border-0 ring-1 ring-black/5 ${item.currentStock < item.minimumThreshold ? 'bg-red-50' : 'bg-white'}`}>
                       <CardContent className="p-4 relative">
                          {item.currentStock < item.minimumThreshold && (
                              <AlertTriangle className="absolute top-4 right-4 h-4 w-4 text-red-500" />
                          )}
                          <div className="mb-2"><Package className="h-5 w-5 text-gray-400" /></div>
                          <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                          <div className="flex items-end gap-1 mt-1">
                             <span className={`text-2xl font-bold ${item.currentStock < item.minimumThreshold ? 'text-red-700' : 'text-gray-900'}`}>{item.currentStock}</span>
                             <span className="text-sm font-medium text-gray-500 pb-0.5">{item.unit}</span>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
                 {items.length === 0 && <p className="text-muted-foreground col-span-full">No inventory materials tracked yet.</p>}
             </div>
          </TabsContent>

          {/* PURCHASES TAB */}
          <TabsContent value="purchases">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                 <h2 className="text-lg font-bold">Grocery Purchase Log</h2>
                 <Button size="sm" onClick={() => setIsPurchaseModalOpen(true)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"><CheckCircle className="mr-2 h-4 w-4" /> Log Purchase (Req. Invoice)</Button>
             </div>
             <div className="hidden md:block">
               <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-x-auto">
                   <table className="w-full text-sm text-left min-w-[600px]">
                       <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                           <tr>
                               <th className="px-4 py-3 font-medium">Date</th>
                               <th className="px-4 py-3 font-medium">Item & Qty</th>
                               <th className="px-4 py-3 font-medium">Cost (RUB)</th>
                               <th className="px-4 py-3 font-medium">Linked Remittance</th>
                               <th className="px-4 py-3 font-medium">Proof</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 bg-white">
                           {purchases.map((p: any) => (
                               <tr key={p._id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                                   <td className="px-4 py-3">
                                      <div className="font-bold text-gray-900">{p.itemRef?.name}</div>
                                      <div className="text-xs text-green-600">+{p.quantity} {p.itemRef?.unit}</div>
                                   </td>
                                   <td className="px-4 py-3 font-bold text-red-700">-{p.priceRUB} ₽</td>
                                   <td className="px-4 py-3">
                                       <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 p-1 rounded inline-block">
                                          RUB {p.linkedRemittance?.amountRUB} ({format(new Date(p.linkedRemittance?.date), 'dd MMM')})
                                       </div>
                                   </td>
                                   <td className="px-4 py-3">
                                       <Button variant="outline" size="sm" onClick={() => setPreviewImage(p.invoiceImage)} className="h-7 text-xs"><Eye className="mr-1 h-3 w-3" /> View Invoice</Button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                   {purchases.length === 0 && <div className="p-8 text-center text-muted-foreground bg-white">No purchases found.</div>}
               </Card>
             </div>

             {/* Mobile Card View for Purchases */}
             <div className="md:hidden flex flex-col gap-3">
                 {purchases.map((p: any) => (
                     <div key={p._id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(p.date), 'dd MMM yyyy')}</div>
                                 <div className="font-bold text-gray-900 mt-0.5 text-base">{p.itemRef?.name}</div>
                                 <div className="text-xs text-green-600 font-medium">+{p.quantity} {p.itemRef?.unit}</div>
                             </div>
                             <div className="text-right">
                                 <div className="font-black text-red-700 text-lg">-{p.priceRUB} ₽</div>
                             </div>
                         </div>
                         <div className="border-t border-gray-50 pt-2 mt-1">
                             <div className="flex items-center justify-between">
                                 <div className="text-[10px] text-gray-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                                    Linked: RUB {p.linkedRemittance?.amountRUB}
                                 </div>
                                 <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600" onClick={() => setPreviewImage(p.invoiceImage)}>
                                     <Eye className="h-3.5 w-3.5 mr-1" /> Invoice
                                 </Button>
                             </div>
                         </div>
                     </div>
                 ))}
                 {purchases.length === 0 && (
                     <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                         No purchases logged yet.
                     </div>
                 )}
             </div>
          </TabsContent>

          {/* CONSUMPTIONS TAB */}
          <TabsContent value="consumptions">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                 <h2 className="text-lg font-bold">Kitchen Consumption Log</h2>
                 <Button size="sm" onClick={() => setIsConsumptionModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" /> Log Usage</Button>
             </div>
             <div className="hidden md:block">
               <Card className="shadow-sm border-0 ring-1 ring-black/5 overflow-x-auto">
                   <table className="w-full text-sm text-left min-w-[600px]">
                       <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                           <tr>
                               <th className="px-4 py-3 font-medium">Date</th>
                               <th className="px-4 py-3 font-medium">Item Consumed</th>
                               <th className="px-4 py-3 font-medium">Quantity Used</th>
                               <th className="px-4 py-3 font-medium">Logged By</th>
                               <th className="px-4 py-3 font-medium">Notes</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 bg-white">
                           {consumptions.map((c: any) => (
                               <tr key={c._id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{format(new Date(c.date), 'dd MMM yyyy')}</td>
                                   <td className="px-4 py-3 font-bold text-gray-900">{c.itemRef?.name}</td>
                                   <td className="px-4 py-3 font-bold text-red-600">-{c.quantityUsed} {c.itemRef?.unit}</td>
                                   <td className="px-4 py-3 text-gray-700">{c.loggedBy}</td>
                                   <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{c.notes || '-'}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                   {consumptions.length === 0 && <div className="p-8 text-center text-muted-foreground bg-white">No consumption logs found.</div>}
               </Card>
             </div>

             {/* Mobile Card View for Consumptions */}
             <div className="md:hidden flex flex-col gap-3">
                 {consumptions.map((c: any) => (
                     <div key={c._id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(c.date), 'dd MMM yyyy')}</div>
                                 <div className="font-bold text-gray-900 mt-0.5 text-base">{c.itemRef?.name}</div>
                             </div>
                             <div className="text-right">
                                 <div className="font-black text-red-600 text-lg">-{c.quantityUsed} {c.itemRef?.unit}</div>
                             </div>
                         </div>
                         <div className="border-t border-gray-50 pt-2 mt-1">
                             <div className="flex items-center justify-between text-xs">
                                 <span className="text-gray-500">By: <span className="font-semibold text-gray-700">{c.loggedBy}</span></span>
                             </div>
                             {c.notes && (
                                 <div className="mt-1 pb-1 pt-1 text-[11px] text-gray-500 italic bg-gray-50 px-2 rounded">
                                     {c.notes}
                                 </div>
                             )}
                         </div>
                     </div>
                 ))}
                 {consumptions.length === 0 && (
                     <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                         No consumption logs found.
                     </div>
                 )}
             </div>
          </TabsContent>
       </Tabs>

       {/* CREATE ITEM MODAL */}
       <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>Add New Material</DialogTitle></DialogHeader>
             <form onSubmit={handleCreateItem} className="space-y-4">
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Item Name (e.g. Rice, Chicken)" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required/>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Unit (e.g. kg, pieces)" value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} required/>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" type="text" inputMode="numeric" placeholder="Low Stock Alert Threshold" value={itemForm.minimumThreshold} onChange={e => setItemForm({...itemForm, minimumThreshold: Number(e.target.value) || 0})} required/>
                <Button type="submit" className="w-full bg-orange-600">Save Item</Button>
             </form>
          </DialogContent>
       </Dialog>

       {/* CREATE PURCHASE MODAL */}
       <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
          <DialogContent>
             <DialogHeader>
               <DialogTitle>Log Grocery Purchase</DialogTitle>
               <DialogDescription className="text-red-500 font-bold">Mandatory: Must link to a valid Remittance and upload Invoice.</DialogDescription>
             </DialogHeader>
             <form onSubmit={handleCreatePurchase} className="space-y-4">
                <select className="flex h-9 w-full rounded-md border px-3 text-sm bg-white" value={purchaseForm.itemRef} onChange={e => setPurchaseForm({...purchaseForm, itemRef: e.target.value})} required>
                   <option value="">Select Item...</option>
                   {items.map((i: any) => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                   <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Quantity Bought" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} required/>
                   <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Total Cost (RUB)" value={purchaseForm.priceRUB} onChange={e => setPurchaseForm({...purchaseForm, priceRUB: e.target.value})} required/>
                </div>
                
                <select className="flex h-9 w-full rounded-md border border-red-300 bg-red-50 px-3 text-sm" value={purchaseForm.linkedRemittance} onChange={e => setPurchaseForm({...purchaseForm, linkedRemittance: e.target.value})} required>
                   <option value="">Link to Remittance Source...</option>
                   {remittances.map((r: any) => <option key={r._id} value={r._id}>{format(new Date(r.date), 'dd MMM')} - RUB {r.amountRUB}</option>)}
                </select>
                
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Purchased By (Name)" value={purchaseForm.purchasedBy} onChange={e => setPurchaseForm({...purchaseForm, purchasedBy: e.target.value})} required/>
                
                <div className="border border-red-200 border-dashed rounded-md p-3 bg-red-50/50">
                    <label className="text-xs font-semibold text-red-700 block mb-2">Upload Invoice Proof (Required)</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs" required />
                </div>
                
                <Button type="submit" className="w-full bg-green-600">Save Secure Purchase</Button>
             </form>
          </DialogContent>
       </Dialog>

       {/* CREATE CONSUMPTION MODAL */}
       <Dialog open={isConsumptionModalOpen} onOpenChange={setIsConsumptionModalOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>Log Daily Kitchen Deduction</DialogTitle></DialogHeader>
             <form onSubmit={handleCreateConsumption} className="space-y-4">
                <select className="flex h-9 w-full rounded-md border px-3 text-sm bg-white" value={consumptionForm.itemRef} onChange={e => setConsumptionForm({...consumptionForm, itemRef: e.target.value})} required>
                   <option value="">Select Item to consume...</option>
                   {items.map((i: any) => <option key={i._id} value={i._id}>{i.name} (Available: {i.currentStock} {i.unit})</option>)}
                </select>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Quantity Used" value={consumptionForm.quantityUsed} onChange={e => setConsumptionForm({...consumptionForm, quantityUsed: e.target.value})} required/>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Logged By (Name)" value={consumptionForm.loggedBy} onChange={e => setConsumptionForm({...consumptionForm, loggedBy: e.target.value})} required/>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Notes (Optional)" value={consumptionForm.notes} onChange={e => setConsumptionForm({...consumptionForm, notes: e.target.value})} />
                <Button type="submit" className="w-full bg-blue-600">Log Usage & Deduct Stock</Button>
             </form>
          </DialogContent>
       </Dialog>

       {/* Image Preview Modal */}
       <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
           <DialogContent className="sm:max-w-2xl">
               <DialogHeader><DialogTitle>Purchase Invoice Proof</DialogTitle></DialogHeader>
               <div className="flex justify-center bg-gray-50 flex-1 min-h-[300px] rounded-lg overflow-hidden border">
                   {previewImage && <img src={previewImage} alt="Proof" className="max-h-[70vh] object-contain" />}
               </div>
           </DialogContent>
       </Dialog>

    </div>
  );
}

const CheckCircle = ({className}:any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
