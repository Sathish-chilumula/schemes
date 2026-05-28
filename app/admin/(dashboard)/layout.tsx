import { Metadata } from 'next';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';

export const metadata: Metadata = {
  title: 'SchemeAtlas CMS',
  description: 'Admin Dashboard for SchemeAtlas',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
