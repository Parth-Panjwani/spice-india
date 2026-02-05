'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface TransactionFormProps {
  categoryId: string;
  entityId: string;
  onSuccess: (transaction: any) => void;
  onCancel: () => void;
  initialData?: any;
  isSimpleCategory?: boolean; // True for Rent, Grocery, etc.
}

// Staff-specific sub types
const STAFF_SUB_TYPES = ['Salary', 'Visa', 'Ticket', 'Other'];

export default function TransactionForm({ 
  categoryId, 
  entityId, 
  onSuccess, 
  onCancel, 
  initialData,
  isSimpleCategory = false 
}: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [rubalRate, setRubalRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [subType, setSubType] = useState('Other');
  const [loading, setLoading] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount?.toString() || '');
      setRubalRate(initialData.rubalRate?.toString() || '');
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
      setDescription(initialData.description || '');
      setSubType(initialData.subType || 'Other');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/transactions/${initialData._id}` : '/api/transactions';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          rubalAmount: rubalRate ? parseFloat(amount) * parseFloat(rubalRate) : undefined,
          rubalRate: rubalRate ? parseFloat(rubalRate) : undefined,
          date,
          description,
          subType: isSimpleCategory ? 'Expense' : subType, // Simple categories always use 'Expense'
          category: categoryId, 
          entity: entityId,     
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
      } else {
        console.error('Failed to save transaction');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount and Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Amount (₹)</label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
            placeholder="0.00"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Rubal Rate</label>
           <div className="relative">
              <input 
                 type="number" 
                 step="0.01"
                 className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
                 placeholder="0.82"
                 value={rubalRate}
                 onChange={(e) => setRubalRate(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">₽</span>
           </div>
        </div>
      </div>
      
      {amount && rubalRate && (
           <div className="text-xs text-right font-mono font-medium text-orange-600 -mt-2">
               ≈ {(parseFloat(amount) * parseFloat(rubalRate)).toFixed(0)} RUB
           </div>
      )}

      {/* Date and Type (Type only for Staff) */}
      <div className={isSimpleCategory ? '' : 'grid grid-cols-2 gap-3'}>
          <div className={isSimpleCategory ? 'w-full' : ''}>
            <label className="text-xs font-medium block mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
            />
          </div>

          {/* Only show Type dropdown for Staff category */}
          {!isSimpleCategory && (
            <div>
              <label className="text-xs font-medium block mb-1">Type</label>
              <select 
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input px-3 text-sm bg-background"
              >
                {STAFF_SUB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex min-h-[70px] w-full rounded-lg border border-input px-3 py-2 text-sm"
          placeholder="e.g., January rent, Groceries from market..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          {loading ? 'Saving...' : initialData ? 'Update' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
