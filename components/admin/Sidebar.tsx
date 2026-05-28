'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, Tags, Settings, LogOut } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase-admin-client';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createAdminClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Schemes', href: '/admin/schemes', icon: FileText },
    { name: 'Articles', href: '/admin/articles', icon: FileText },
    { name: 'New Article', href: '/admin/articles/new', icon: Plus },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">SA</span>
          </div>
          <span className="font-bold text-xl tracking-tight">SchemeAtlas</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
