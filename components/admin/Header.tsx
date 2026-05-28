'use client';

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createAdminClient } from '@/lib/supabase-admin-client';

export default function Header() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createAdminClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || 'Admin User');
      }
    };
    getUser();
  }, [supabase]);

  // Generate page title based on route
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname === '/admin/articles') return 'Articles';
    if (pathname === '/admin/articles/new') return 'New Article';
    if (pathname.includes('/edit')) return 'Edit Article';
    if (pathname === '/admin/categories') return 'Categories';
    if (pathname === '/admin/settings') return 'Settings';
    return 'Admin';
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
      <h1 className="text-xl font-bold text-slate-800">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
            <User size={14} />
          </div>
          {email || 'Loading...'}
        </div>
      </div>
    </header>
  );
}
