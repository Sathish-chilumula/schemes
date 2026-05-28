'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { PenLine, Trash2, Plus, Search, Eye } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export const runtime = 'edge';

type Article = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  author_name: string;
  categories: { name: string } | null;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<{id: string, title: string} | null>(null);
  
  const supabase = createAdminClient();

  const fetchArticles = async () => {
    setLoading(true);
    let query = supabase
      .from('articles')
      .select('id, title, slug, status, published_at, author_name, categories(name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!articleToDelete) return;
    await supabase.from('articles').delete().eq('id', articleToDelete.id);
    setArticles(articles.filter(a => a.id !== articleToDelete.id));
    setArticleToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search articles by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          New Article
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading articles...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No articles found matching your criteria.</td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 truncate max-w-[300px]">{article.title}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-[300px]">{article.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {article.categories && !Array.isArray(article.categories) 
                          ? (article.categories as any).name 
                          : (Array.isArray(article.categories) ? (article.categories[0] as any)?.name : 'Uncategorized') || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {article.author_name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a href={`/articles/${article.slug}`} target="_blank" className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View on site">
                          <Eye size={18} />
                        </a>
                        <Link href={`/admin/articles/${article.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <PenLine size={18} />
                        </Link>
                        <button
                          onClick={() => {
                            setArticleToDelete({ id: article.id, title: article.title });
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
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
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={articleToDelete?.title || ''}
        itemType="Article"
      />
    </div>
  );
}
