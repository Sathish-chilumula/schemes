'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { Save, Send } from 'lucide-react';
import TipTapEditor from '@/components/admin/TipTapEditor';

type Category = { id: string; name: string };

type ArticleFormProps = {
  initialData?: any;
  isEdit?: boolean;
};

export default function ArticleForm({ initialData, isEdit }: ArticleFormProps) {
  const router = useRouter();
  const supabase = createAdminClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    featured_image: initialData?.featured_image || '',
    category_id: initialData?.category_id || '',
    status: initialData?.status || 'draft',
    scheduled_at: initialData?.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
    author_name: initialData?.author_name || 'SchemeAtlas Editorial',
    meta_title: initialData?.meta_title || '',
    meta_description: initialData?.meta_description || '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, [supabase]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!isEdit) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData({ ...formData, title, slug });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: 'draft' | 'published') => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      status: formData.status === 'scheduled' ? 'scheduled' : submitStatus,
      published_at: submitStatus === 'published' ? new Date().toISOString() : initialData?.published_at,
      scheduled_at: formData.status === 'scheduled' ? new Date(formData.scheduled_at).toISOString() : null,
      category_id: formData.category_id || null,
    };

    let result;
    if (isEdit && initialData?.id) {
      result = await supabase.from('articles').update(payload).eq('id', initialData.id);
    } else {
      result = await supabase.from('articles').insert([payload]);
    }

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      router.push('/admin/articles');
      router.refresh();
    }
  };

  const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form className="max-w-5xl space-y-8 pb-20">
      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl font-bold border border-rose-200">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Article Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={handleTitleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xl font-bold"
            placeholder="Enter article title..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Slug URL</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
            Content
            <span className="text-slate-400 font-normal">{wordCount} words</span>
          </label>
          <TipTapEditor 
            content={formData.content} 
            onChange={(html) => setFormData({ ...formData, content: html })} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            rows={3}
          />
        </div>
      </div>

      {/* Sidebar Settings (Inline for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Publishing</h3>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {formData.status === 'scheduled' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Schedule Date & Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Author</label>
            <input
              type="text"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Media & SEO</h3>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Featured Image URL</label>
            <input
              type="url"
              value={formData.featured_image}
              onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
              placeholder="https://..."
            />
            {formData.featured_image && (
              <img src={formData.featured_image} alt="Preview" className="mt-4 rounded-xl h-32 w-full object-cover border border-slate-200" />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Title</label>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Meta Description</label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 z-30 px-8">
        <button
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e, 'draft')}
          className="px-6 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          Save as Draft
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e, 'published')}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Send size={18} />
          Publish Now
        </button>
      </div>
    </form>
  );
}
