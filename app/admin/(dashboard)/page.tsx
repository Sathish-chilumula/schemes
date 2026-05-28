import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { PenLine, Eye } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';

export const runtime = 'edge';

// We disable caching for the dashboard to always show fresh stats
export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = supabaseAdmin();

  // Fetch counts
  const [{ count: totalArticles }, { count: publishedArticles }, { count: draftArticles }, { count: scheduledArticles }, { count: totalCategories }] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  // Fetch recent articles
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, slug, status, published_at, categories(name)')
    .order('created_at', { ascending: false })
    .limit(10);

  const stats = [
    { label: 'Total Articles', value: totalArticles || 0, color: 'text-slate-900' },
    { label: 'Published', value: publishedArticles || 0, color: 'text-green-600' },
    { label: 'Drafts', value: draftArticles || 0, color: 'text-yellow-600' },
    { label: 'Scheduled', value: scheduledArticles || 0, color: 'text-blue-600' },
    { label: 'Categories', value: totalCategories || 0, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 mb-2">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Articles</h2>
          <Link href="/admin/articles" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentArticles?.map((article) => (
                <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 truncate max-w-[300px]">{article.title}</p>
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
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/articles/${article.slug}`} target="_blank" className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Eye size={18} />
                      </a>
                      <Link href={`/admin/articles/${article.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <PenLine size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {(!recentArticles || recentArticles.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No articles found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
