'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Upload, Eye, FileText, AlertTriangle, Package, Activity, LogOut, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function InventoryManager({ initialItems, initialPurchases, initialConsumptions, remittances, initialRequests }: any) {
  const { role } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [consumptions, setConsumptions] = useState(initialConsumptions);
  const [requests, setRequests] = useState(initialRequests || []);

  useEffect(() => {
    setItems(initialItems);
    setPurchases(initialPurchases);
    setConsumptions(initialConsumptions);
    setRequests(initialRequests || []);
  }, [initialItems, initialPurchases, initialConsumptions, initialRequests]);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isItemRequestModalOpen, setIsItemRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();

  const groceryRemittances = remittances.filter((r: any) => r.purpose === 'Groceries');
  const totalRemitted = groceryRemittances.reduce((sum: number, r: any) => sum + (Number(r.amountRUB) || 0), 0);
  const totalSpent = purchases.reduce((sum: number, p: any) => sum + (Number(p.priceRUB) || 0), 0);
  const remainingBudget = totalRemitted - totalSpent;

  // Form States
  const [itemForm, setItemForm] = useState({ name: '', unit: '', minimumThreshold: 5 });
  const [purchaseForm, setPurchaseForm] = useState({ itemRef: '', quantity: '', priceRUB: '', purchasedBy: '', linkedRemittance: '', invoiceImage: '' });
  const [consumptionForm, setConsumptionForm] = useState({ itemRef: '', quantityUsed: '', loggedBy: '', notes: '' });

  const defaultRequestForm = { itemName: '', quantityNeeded: '', unit: '', notes: '' };
  const [requestForm, setRequestForm] = useState(defaultRequestForm);

  // --- HANDLERS ---
  const openNewItemModal = () => {
      setEditingItemId(null);
      setItemForm({ name: '', unit: '', minimumThreshold: 5 });
      setIsItemModalOpen(true);
  };
  const openEditItemModal = (item: any) => {
      setEditingItemId(item._id);
      setItemForm({ name: item.name, unit: item.unit, minimumThreshold: item.minimumThreshold });
      setIsItemModalOpen(true);
  };
  const deleteItem = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(!confirm("Are you sure you want to delete this material?")) return;
      try {
          const res = await fetch(`/api/inventory/items/${id}`, { method: 'DELETE' });
          if(res.ok) {
              setItems(items.filter((i: any) => i._id !== id));
              router.refresh();
          } else { alert("Failed to delete item. It might have linked logs."); }
      } catch(err) { console.error(err); }
  };

  const openNewPurchaseModal = () => {
      setEditingPurchaseId(null);
      setPurchaseForm({ itemRef: '', quantity: '', priceRUB: '', purchasedBy: '', linkedRemittance: '', invoiceImage: '' });
      setIsPurchaseModalOpen(true);
  };
  const openEditPurchaseModal = (p: any) => {
      setEditingPurchaseId(p._id);
      setPurchaseForm({
          itemRef: p.itemRef?._id || '',
          quantity: p.quantity.toString(),
          priceRUB: p.priceRUB.toString(),
          purchasedBy: p.purchasedBy,
          linkedRemittance: p.linkedRemittance?._id || '',
          invoiceImage: p.invoiceImage || ''
      });
      setIsPurchaseModalOpen(true);
  };
  const deletePurchase = async (id: string) => {
      if(!confirm("Are you sure you want to delete this purchase? This will DECREMENT the live stock.")) return;
      try {
          const res = await fetch(`/api/inventory/purchases/${id}`, { method: 'DELETE' });
          if(res.ok) router.refresh();
      } catch(err) { console.error(err); }
  };

  const openNewConsumptionModal = () => {
      setEditingConsumptionId(null);
      setConsumptionForm({ itemRef: '', quantityUsed: '', loggedBy: '', notes: '' });
      setIsConsumptionModalOpen(true);
  };
  const openEditConsumptionModal = (c: any) => {
      setEditingConsumptionId(c._id);
      setConsumptionForm({
          itemRef: c.itemRef?._id || '',
          quantityUsed: c.quantityUsed.toString(),
          loggedBy: c.loggedBy,
          notes: c.notes || ''
      });
      setIsConsumptionModalOpen(true);
  };
  const deleteConsumption = async (id: string) => {
      if(!confirm("Are you sure you want to delete this usage log? This will REFUND the live stock.")) return;
      try {
          const res = await fetch(`/api/inventory/consumptions/${id}`, { method: 'DELETE' });
          if(res.ok) router.refresh();
      } catch(err) { console.error(err); }
  };

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
      const url = editingItemId ? `/api/inventory/items/${editingItemId}` : '/api/inventory/items';
      const method = editingItemId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: JSON.stringify(itemForm) });
      if (res.ok) {
        if (!editingItemId) {
           const newItem = await res.json();
           setItems([...items, newItem].sort((a:any, b:any) => a.name.localeCompare(b.name)));
        } else {
           router.refresh(); 
        }
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
      const url = editingPurchaseId ? `/api/inventory/purchases/${editingPurchaseId}` : '/api/inventory/purchases';
      const method = editingPurchaseId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: JSON.stringify({...purchaseForm, quantity: Number(purchaseForm.quantity), priceRUB: Number(purchaseForm.priceRUB)}) });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        router.refresh(); 
      } else {
        alert('Failed to save purchase');
      }
    } finally { setLoading(false); }
  };

  const handleCreateConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingConsumptionId ? `/api/inventory/consumptions/${editingConsumptionId}` : '/api/inventory/consumptions';
      const method = editingConsumptionId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: JSON.stringify({...consumptionForm, quantityUsed: Number(consumptionForm.quantityUsed)}) });
      if (res.ok) {
        setIsConsumptionModalOpen(false);
        router.refresh(); 
      }
    } finally { setLoading(false); }
  };

  const handleCreateItemRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch('/api/inventory/requests', {
            method: 'POST',
            body: JSON.stringify({ ...requestForm, requestedBy: role === 'cook' ? 'Kitchen Cook' : 'Staff' })
        });
        if (res.ok) {
            setIsItemRequestModalOpen(false);
            setRequestForm(defaultRequestForm);
            router.refresh();
        }
    } finally { setLoading(false); }
  };

  const updateItemRequestStatus = async (id: string, status: string) => {
      setLoading(true);
      try {
          const res = await fetch(`/api/inventory/requests/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ status })
          });
          if (res.ok) router.refresh();
      } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={role === 'cook' ? 'consumptions' : 'stock'} className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto justify-start bg-white border rounded-lg h-auto p-1 gap-1 whitespace-nowrap">
              {role !== 'cook' && <TabsTrigger value="stock" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Live Stock</TabsTrigger>}
              {role !== 'cook' && <TabsTrigger value="purchases" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Bought Items</TabsTrigger>}
              <TabsTrigger value="consumptions" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Daily Usage</TabsTrigger>
              <TabsTrigger value="requests" className="rounded-md data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 text-xs sm:text-sm flex-shrink-0">Item Requests</TabsTrigger>
            </TabsList>

            {/* STOCK TAB */}
            {role !== 'cook' && (
              <TabsContent value="stock">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold">Kitchen Stock</h2>
                  <Button size="sm" onClick={openNewItemModal} className="bg-orange-600 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Material</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item: any) => (
                    <Card key={item._id} className={`shadow-sm border-0 ring-1 ring-black/5 ${item.currentStock < item.minimumThreshold ? 'bg-red-50' : 'bg-white'}`}>
                      <CardContent className="p-4 relative hover:bg-gray-50 transition-colors group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600 bg-white shadow-sm ring-1 ring-black/5" onClick={() => openEditItemModal(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600 bg-white shadow-sm ring-1 ring-black/5" onClick={(e) => deleteItem(item._id, e)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {item.currentStock < item.minimumThreshold && (
                          <AlertTriangle className="absolute top-4 right-4 h-4 w-4 text-red-500 group-hover:opacity-0" />
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
            )}

            {/* PURCHASES TAB */}
            {role !== 'cook' && (
              <TabsContent value="purchases">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold">Items Bought</h2>
                  <Button size="sm" onClick={openNewPurchaseModal} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"><CheckCircle className="mr-2 h-4 w-4" /> Log Bought Item (Req. Invoice)</Button>
                </div>

                {/* BUDGET SUMMARY CARD */}
                <div className="mb-4 bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-orange-900">Available Grocery Budget</p>
                    <p className="text-xs text-orange-700">Money Sent for Groceries ({totalRemitted.toLocaleString()} ₽) minus Logged Receipts ({totalSpent.toLocaleString()} ₽)</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={`text-2xl font-black tracking-tight ${remainingBudget < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {remainingBudget > 0 ? '+' : ''}{remainingBudget.toLocaleString()} ₽
                    </p>
                  </div>
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
                              <div className="flex gap-1 items-center">
                                <Button variant="outline" size="sm" onClick={() => setPreviewImage(p.invoiceImage)} className="h-7 text-xs"><Eye className="mr-1 h-3 w-3" /> View</Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => openEditPurchaseModal(p)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => deletePurchase(p._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {purchases.length === 0 && <div className="p-8 text-center text-muted-foreground bg-white">No items bought yet.</div>}
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
                          <div className="flex flex-col gap-1">
                            <div className="text-[10px] text-gray-500">Bought by: <span className="font-semibold text-gray-700">{p.purchasedBy}</span></div>
                            <div className="text-[10px] text-gray-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit inline-block">
                              Linked: RUB {p.linkedRemittance?.amountRUB}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 bg-gray-50" onClick={() => openEditPurchaseModal(p)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 bg-gray-50" onClick={() => deletePurchase(p._id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 px-2 bg-gray-50 hover:bg-gray-100" onClick={() => setPreviewImage(p.invoiceImage)}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                      No items bought yet.
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* CONSUMPTIONS TAB */}
            <TabsContent value="consumptions">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-lg font-bold">Kitchen Daily Usage</h2>
                <Button size="sm" onClick={openNewConsumptionModal} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" /> Log Usage</Button>
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
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 items-center justify-end">
                              {role !== 'cook' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => openEditConsumptionModal(c)}><Edit className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => deleteConsumption(c._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </>
                              )}
                            </div>
                          </td>
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
                        <div className="flex items-center gap-1">
                          {role !== 'cook' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600 bg-gray-50" onClick={() => openEditConsumptionModal(c)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600 bg-gray-50" onClick={() => deleteConsumption(c._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                        </div>
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

            {/* REQUESTS TAB */}
            <TabsContent value="requests">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                   <h2 className="text-lg font-bold">Kitchen Supply Requests</h2>
                   <Button size="sm" onClick={() => setIsItemRequestModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Request Supply</Button>
               </div>
               
               <div className="grid gap-3">
                   {requests.map((req: any) => (
                       <Card key={req._id} className="p-4 shadow-sm border border-gray-100">
                           <div className="flex justify-between items-start">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <h3 className="font-bold text-gray-900 text-lg">{req.itemName}</h3>
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : req.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                           {req.status}
                                       </span>
                                   </div>
                                   <p className="font-medium text-red-600">Needed: {req.quantityNeeded} {req.unit}</p>
                                   {req.notes && <p className="text-xs text-muted-foreground mt-1 text-gray-700 font-medium">Note: {req.notes}</p>}
                                   <p className="text-[10px] text-muted-foreground mt-2">Requested by {req.requestedBy} on {format(new Date(req.dateRequested), 'dd MMM yyyy')}</p>
                               </div>
                               
                               {role !== 'cook' && req.status === 'pending' && (
                                   <div className="flex flex-col gap-2">
                                       <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateItemRequestStatus(req._id, 'approved')}>Approve</Button>
                                       <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => updateItemRequestStatus(req._id, 'rejected')}>Reject</Button>
                                   </div>
                               )}
                               {role !== 'cook' && req.status === 'approved' && (
                                   <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => updateItemRequestStatus(req._id, 'fulfilled')}>Mark Bought</Button>
                               )}
                           </div>
                       </Card>
                   ))}
                   {requests.length === 0 && (
                       <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white rounded-lg border border-dashed">
                           No pending supply requests.
                       </div>
                   )}
               </div>
            </TabsContent>
          </Tabs>

          {/* CREATE ITEM MODAL */}
          <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingItemId ? 'Edit Material' : 'Add New Material'}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Item Name (e.g. Rice, Chicken)" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required />
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Unit (e.g. kg, pieces)" value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} required />
                <input className="flex h-9 w-full rounded-md border text-sm px-3" type="text" inputMode="numeric" placeholder="Low Stock Alert Threshold" value={itemForm.minimumThreshold} onChange={e => setItemForm({ ...itemForm, minimumThreshold: Number(e.target.value) || 0 })} required />
                <Button type="submit" disabled={loading} className="w-full bg-orange-600">{editingItemId ? 'Update Item' : 'Save Item'}</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* CREATE PURCHASE MODAL */}
          <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPurchaseId ? 'Edit Bought Item' : 'Log Bought Item'}</DialogTitle>
                <DialogDescription className="text-red-500 font-bold">Mandatory: Must link to a valid Money Transfer and upload Invoice.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePurchase} className="space-y-4">
                <select className="flex h-9 w-full rounded-md border px-3 text-sm bg-white" value={purchaseForm.itemRef} onChange={e => setPurchaseForm({ ...purchaseForm, itemRef: e.target.value })} required>
                  <option value="">Select Item...</option>
                  {items.map((i: any) => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Quantity Bought" value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} required />
                  <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Total Cost (RUB)" value={purchaseForm.priceRUB} onChange={e => setPurchaseForm({ ...purchaseForm, priceRUB: e.target.value })} required />
                </div>
                
                <select className="flex h-9 w-full rounded-md border border-red-300 bg-red-50 px-3 text-sm" value={purchaseForm.linkedRemittance} onChange={e => setPurchaseForm({ ...purchaseForm, linkedRemittance: e.target.value })} required>
                  <option value="">Link to Money Transfer Source...</option>
                  {groceryRemittances.map((r: any) => <option key={r._id} value={r._id}>{format(new Date(r.date), 'dd MMM')} - RUB {r.amountRUB}</option>)}
                </select>
                
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Bought By (Name)" value={purchaseForm.purchasedBy} onChange={e => setPurchaseForm({ ...purchaseForm, purchasedBy: e.target.value })} required />
                
                <div className="border border-red-200 border-dashed rounded-md p-3 bg-red-50/50">
                  <label className="text-xs font-semibold text-red-700 block mb-2">Upload Invoice Proof (Required)</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs" required />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full bg-green-600">
                  {loading ? 'Saving securely...' : (editingPurchaseId ? 'Update Secure Entry' : 'Save Secure Entry')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* CREATE CONSUMPTION MODAL */}
          <Dialog open={isConsumptionModalOpen} onOpenChange={setIsConsumptionModalOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingConsumptionId ? 'Edit Kitchen Deduction' : 'Log Daily Kitchen Deduction'}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateConsumption} className="space-y-4">
                <select className="flex h-9 w-full rounded-md border px-3 text-sm bg-white" value={consumptionForm.itemRef} onChange={e => setConsumptionForm({ ...consumptionForm, itemRef: e.target.value })} required>
                  <option value="">Select Item to consume...</option>
                  {items.map((i: any) => <option key={i._id} value={i._id}>{i.name} (Available: {i.currentStock} {i.unit})</option>)}
                </select>
                <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Quantity Used" value={consumptionForm.quantityUsed} onChange={e => setConsumptionForm({ ...consumptionForm, quantityUsed: e.target.value })} required />
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Logged By (Name)" value={consumptionForm.loggedBy} onChange={e => setConsumptionForm({ ...consumptionForm, loggedBy: e.target.value })} required />
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Notes (Optional)" value={consumptionForm.notes} onChange={e => setConsumptionForm({ ...consumptionForm, notes: e.target.value })} />
                <Button type="submit" disabled={loading} className="w-full bg-blue-600">{editingConsumptionId ? 'Update Usage' : 'Log Usage & Deduct Stock'}</Button>
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

          {/* CREATE ITEM REQUEST MODAL */}
          <Dialog open={isItemRequestModalOpen} onOpenChange={setIsItemRequestModalOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Request Kitchen Supplies</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateItemRequest} className="space-y-4">
                <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Item Name (e.g. Rice, Potatoes)" value={requestForm.itemName} onChange={e => setRequestForm({ ...requestForm, itemName: e.target.value })} required />
                <div className="grid grid-cols-2 gap-4">
                  <input className="flex h-9 w-full rounded-md border text-sm px-3" type="number" step="0.01" placeholder="Quantity Needed" value={requestForm.quantityNeeded} onChange={e => setRequestForm({ ...requestForm, quantityNeeded: e.target.value })} required />
                  <input className="flex h-9 w-full rounded-md border text-sm px-3" placeholder="Unit (kg, pieces, ltr)" value={requestForm.unit} onChange={e => setRequestForm({ ...requestForm, unit: e.target.value })} required />
                </div>
                <textarea className="flex w-full rounded-md border text-sm px-3 py-2" rows={2} placeholder="Notes / Specific Brand if needed..." value={requestForm.notes} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} />
                <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">Submit Request for Approval</Button>
              </form>
            </DialogContent>
          </Dialog>

        </div>
      );
    }

const CheckCircle = ({ className }: any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
