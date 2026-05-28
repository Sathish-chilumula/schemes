'use client';

import { useEffect, useState, useCallback } from 'react';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { Search, ExternalLink, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';

export const runtime = 'edge';

type Scheme = {
  id: string;
  name: string;
  slug: string;
  category: string;
  country_code: string;
  is_published: boolean;
  updated_at: string;
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const supabase = createAdminClient();

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('schemes')
      .select('id, name, slug, category, country_code, is_published, updated_at', { count: 'exact' });

    if (statusFilter === 'published') query = query.eq('is_published', true);
    if (statusFilter === 'draft') query = query.eq('is_published', false);
    
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
    if (countryFilter !== 'all') query = query.eq('country_code', countryFilter);
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('updated_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    
    if (data) setSchemes(data);
    if (count !== null) setTotalCount(count);
    
    setLoading(false);
  }, [page, search, categoryFilter, statusFilter, countryFilter]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, countryFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Database Schemes</h1>
        <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total: {totalCount} items
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 text-slate-700 font-medium min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 text-slate-700 font-medium min-w-[120px]"
          >
            <option value="all">All Countries</option>
            <option value="IN">India (IN)</option>
            <option value="US">USA (US)</option>
            <option value="GB">UK (GB)</option>
            <option value="NG">Nigeria (NG)</option>
            <option value="KE">Kenya (KE)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & Slug</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Loading schemes...</p>
                    </div>
                  </td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No schemes found matching your criteria.</td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{scheme.name}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{scheme.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {scheme.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{scheme.country_code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        scheme.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {scheme.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`/schemes/${scheme.slug}`} 
                        target="_blank" 
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" 
                        title="View Live Page"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm font-medium text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
