'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IncomeListProps {
  initialIncomes: any[];
}

export default function IncomeList({ initialIncomes }: IncomeListProps) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment record?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/income/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIncomes(prev => prev.filter(inc => inc._id !== id));
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting');
    } finally {
      setDeletingId(null);
    }
  };

  if (incomes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
        No payments recorded yet.
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((inc: any) => (
              <tr key={inc._id} className="bg-white border-b hover:bg-gray-50 group">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{inc.student?.fullName || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{inc.student?.studentId || '-'}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(inc.date), 'dd MMM yy')}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{inc.description}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-500">
                  {inc.rubalRate ? `${inc.rubalRate}₽` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-bold text-green-600">+₹{inc.amount.toLocaleString()}</div>
                  {inc.rubalAmount && <div className="text-[10px] text-orange-600 font-mono">≈ {inc.rubalAmount.toFixed(0)} RUB</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(inc._id)}
                    disabled={deletingId === inc._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - Hidden on Desktop */}
      <div className="md:hidden space-y-3">
        {incomes.map((inc: any) => (
          <div 
            key={inc._id} 
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div 
              className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50"
              onClick={() => setExpandedId(expandedId === inc._id ? null : inc._id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">₹</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{inc.student?.fullName || 'Payment'}</div>
                  <div className="text-xs text-gray-500">{format(new Date(inc.date), 'dd MMM yyyy')}</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <div className="font-bold text-green-600">+₹{inc.amount.toLocaleString()}</div>
                  {inc.rubalAmount && <div className="text-[10px] text-orange-600 font-mono">≈ {inc.rubalAmount.toFixed(0)} ₽</div>}
                </div>
                {expandedId === inc._id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Expanded Details */}
            {expandedId === inc._id && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Student ID</span>
                  <span className="font-mono">{inc.student?.studentId || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Period</span>
                  <span className="text-xs text-right max-w-[60%]">{inc.description}</span>
                </div>
                {inc.rubalRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate</span>
                    <span className="font-mono">{inc.rubalRate} ₽/₹</span>
                  </div>
                )}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(inc._id)}
                    disabled={deletingId === inc._id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
