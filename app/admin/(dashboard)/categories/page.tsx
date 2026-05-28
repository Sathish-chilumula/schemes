'use client';

import { useEffect, useState } from 'react';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { PenLine, Trash2, Plus } from 'lucide-react';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export const runtime = 'edge';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count?: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = createAdminClient();

  const fetchCategories = async () => {
    setLoading(true);
    // Fetch categories with count of related articles using a subquery
    const { data, error } = await supabase
      .from('categories')
      .select('*, articles(count)')
      .order('name');
      
    if (data) {
      setCategories(data.map(cat => ({
        ...cat,
        article_count: cat.articles[0]?.count || 0
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate slug only if we're not editing an existing one where they might want to keep the old slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, name, slug: editingId ? formData.slug : slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('categories').update(formData).eq('id', editingId);
    } else {
      await supabase.from('categories').insert([formData]);
    }
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '' });
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    setEditingId(cat.id);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    // Check if it has articles attached
    if (categoryToDelete.article_count && categoryToDelete.article_count > 0) {
      setDeleteError(`Cannot delete — ${categoryToDelete.article_count} articles use this category. Please reassign them first.`);
      setDeleteModalOpen(false);
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
    if (error) {
      alert('Error deleting category');
    } else {
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
    }
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', slug: '', description: '' });
            setIsFormOpen(true);
          }}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {deleteError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex justify-between items-center">
          <p className="font-medium">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{editingId ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
              >
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Articles</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading categories...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No categories found.</td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{cat.name}</p>
                    {cat.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{cat.description}</p>}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{cat.slug}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">{cat.article_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PenLine size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setCategoryToDelete(cat);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={categoryToDelete?.name || ''}
        itemType="Category"
      />
    </div>
  );
}
