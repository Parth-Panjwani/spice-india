'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, ArrowLeft, Trash2, Home, ShoppingCart, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Entity {
  _id: string;
  name: string;
  category: string;
}

// Icon based on category
const getEntityIcon = (categoryName: string) => {
  const lower = categoryName?.toLowerCase() || '';
  if (lower === 'staff') return <User className="h-5 w-5 text-green-600" />;
  if (lower === 'rent') return <Home className="h-5 w-5 text-blue-600" />;
  if (lower === 'grocery' || lower === 'groceries') return <ShoppingCart className="h-5 w-5 text-orange-600" />;
  return <Building className="h-5 w-5 text-gray-500" />;
};

export default function EntityList({ 
  categoryId, 
  categoryName, 
  initialEntities 
}: { 
  categoryId: string;
  categoryName: string;
  initialEntities: Entity[] 
}) {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName, category: categoryId }),
      });

      if (res.ok) {
        const newEntity = await res.json();
        setEntities([...entities, newEntity]);
        setNewEntityName('');
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add entity', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Delete this item? All expenses within will also be deleted.')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntities(entities.filter(ent => ent._id !== id));
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete entity', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-4">
        <Button variant="outline" onClick={() => router.push('/expenses')} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
        </Button>
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add {categoryName === 'Staff' ? 'Staff Member' : 'Item'}
        </Button>
      </div>

      {/* Entity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {entities.map((entity) => (
          <Link href={`/expenses/${categoryId}/${entity._id}`} key={entity._id}>
            <Card className="group relative hover:shadow-md transition-all cursor-pointer h-full border-gray-100 active:scale-[0.98]">
              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteEntity(entity._id, e)}
                disabled={deletingId === entity._id}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm border border-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getEntityIcon(categoryName)}
                  {entity.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">View Expenses</p>
              </CardContent>
            </Card>
          </Link>
        ))}

        {entities.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground p-10 bg-gray-50 rounded-xl">
                No items found in {categoryName}. <br/>
                Add a new one to start tracking expenses.
            </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-5 rounded-xl w-full max-w-sm border shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add New {categoryName === 'Staff' ? 'Staff' : 'Entity'}</h3>
            <form onSubmit={handleAddEntity} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base mt-1"
                  placeholder={categoryName === 'Staff' ? "e.g., Raj Kumar" : "e.g., Main Office"}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                  {loading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
