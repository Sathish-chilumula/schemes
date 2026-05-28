import ArticleForm from '@/components/admin/ArticleForm';

export const runtime = 'edge';

export default function NewArticlePage() {
  return (
    <div>
      <ArticleForm isEdit={false} />
    </div>
  );
}
