'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Trash2, Users, Home, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  type: string;
  description?: string;
}

// Icon mapping for known categories
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower === 'staff') return <Users className="h-5 w-5 text-green-600" />;
  if (lower === 'rent') return <Home className="h-5 w-5 text-blue-600" />;
  if (lower === 'grocery' || lower === 'groceries') return <ShoppingCart className="h-5 w-5 text-orange-600" />;
  return <FolderOpen className="h-5 w-5 text-gray-500" />;
};

export default function CategoryList({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, type: 'expense' }),
      });

      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setNewCategoryName('');
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add category', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Delete this category? All entities and expenses within will also be deleted.')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c._id !== id));
        router.refresh();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {categories.map((cat) => (
          <Link href={`/expenses/${cat._id}`} key={cat._id}>
            <Card className="group relative hover:shadow-md transition-all cursor-pointer h-full border-gray-100 active:scale-[0.98]">
              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteCategory(cat._id, e)}
                disabled={deletingId === cat._id}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm border border-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getCategoryIcon(cat.name)}
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Tap to view expenses</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        
        {categories.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground p-10 bg-gray-50 rounded-xl">
                No categories found. Create one to get started.
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-5 rounded-xl w-full max-w-sm border shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base mt-1"
                  placeholder="e.g., Staff, Rent, Grocery"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
