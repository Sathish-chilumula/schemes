import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';

export const runtime = 'edge';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = supabaseAdmin();
  const { data: news } = await supabase.from('schemes').select('name, content_en').eq('slug', resolvedParams.slug).single();
  if (!news) return {};
  return {
    title: `${news.name} - Latest Government Decision & News | SchemeAtlas`,
    description: news.content_en?.substring(0, 160) || `Read out more about ${news.name} and how it impacts you.`,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = supabaseAdmin();
  const { data: item } = await supabase.from('schemes').select('*').eq('slug', resolvedParams.slug).single();

  if (!item) notFound();

  const eligibility = item.eligibility || {};
  const howToApply = item.how_to_apply || { steps: [] };

  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />

      <div className="bg-[#1a1c2e] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex items-center space-x-2 text-xs text-indigo-400 mb-8 font-black uppercase tracking-widest">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-white">News & Decisions</Link>
          </nav>
          
          <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Official Decision</span>
              <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-white/10">{item.category}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tight">{item.name}</h1>
          
          <div className="flex items-center gap-6 border-t border-white/10 pt-8 mt-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300">
                      📅
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Released</p>
                      <p className="text-white font-black text-sm">{new Date(item.discovered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Article Pillar */}
          <div className="lg:w-2/3 space-y-12">
            
            <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic relative">
               <span className="absolute -top-4 left-8 text-6xl text-indigo-200 font-serif opacity-50">“</span>
               <p className="text-slate-800 text-xl font-bold leading-relaxed relative z-10">
                 {eligibility.impact || 'Government decision recently announced regarding public welfare and policy updates.'}
               </p>
            </section>

            <section className="space-y-6">
               <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-1 h-8 bg-black rounded-full"></span>
                  Decision Rundown
               </h3>
               <div className="text-slate-700 text-lg leading-loose space-y-6 font-medium whitespace-pre-wrap">
                 {item.content_en}
               </div>
            </section>

          </div>

          {/* Sidebar Action Pillar */}
          <div className="lg:w-1/3">
             <div className="sticky top-24 space-y-8">
                 <div className="bg-white p-8 rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_#1a1c2e]">
                     <h4 className="text-sm font-black text-slate-900 uppercase mb-6 tracking-widest flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                         What should you do?
                     </h4>
                     <ul className="space-y-4">
                        {howToApply.steps?.map((step: string, i: number) => (
                           <li key={i} className="flex gap-3 items-start border-b border-slate-100 pb-4">
                              <span className="text-indigo-600 font-black text-lg">›</span>
                              <span className="text-slate-800 font-bold text-sm leading-relaxed">{step}</span>
                           </li>
                        ))}
                     </ul>
                 </div>

                 {item.official_url && (
                     <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Official Notification Link</p>
                         <a 
                            href={item.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-indigo-600 text-white text-center block py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transform transition-all"
                         >
                            View Full PDF / Document ↗
                         </a>
                     </div>
                 )}
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}
