import { supabaseAdmin } from '@/lib/supabase';
import ArticleForm from '@/components/admin/ArticleForm';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const supabase = supabaseAdmin();
  const { data: article } = await supabase.from('articles').select('*').eq('id', params.id).single();

  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center text-sm text-slate-500">
        <p>Editing Article ID: <span className="font-mono">{article.id}</span></p>
        <p>Last Updated: {new Date(article.updated_at).toLocaleString()}</p>
      </div>
      <ArticleForm isEdit={true} initialData={article} />
    </div>
  );
}
