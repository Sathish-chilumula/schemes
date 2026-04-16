import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';


export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const resolvedParams = params;
  const supabase = supabaseAdmin();
  const { data: job } = await supabase.from('schemes').select('name, content_en').eq('slug', resolvedParams.slug).single();
  if (!job) return {};
  return {
    title: `${job.name} Recruitment 2026 - Vacancies, Salary & Apply Online | SchemeAtlas`,
    description: job.content_en?.substring(0, 160) || `Apply for ${job.name} - get vacancy details, salary information, and application steps.`,
  };
}

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const resolvedParams = params;
  const supabase = supabaseAdmin();
  const { data: job } = await supabase.from('schemes').select('*').eq('slug', resolvedParams.slug).single();

  if (!job) notFound();

  const eligibility = job.eligibility || {};
  const howToApply = job.how_to_apply || { steps: [] };

  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />

      <div className="bg-slate-900 text-white py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">
            <Link href="/" className="hover:text-blue-400">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-blue-400">Jobs</Link>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{job.name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-slate-400 text-[10px] uppercase font-black mb-1">Posts</p>
                    <p className="text-blue-400 font-black">{eligibility.vacancies || 'Check Notification'}</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-slate-400 text-[10px] uppercase font-black mb-1">Salary</p>
                    <p className="text-green-400 font-black">{job.what_you_get || 'As per Rules'}</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-slate-400 text-[10px] uppercase font-black mb-1">Status</p>
                    <p className="text-white font-black">Active</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-slate-400 text-[10px] uppercase font-black mb-1">Deadline</p>
                    <p className="text-red-400 font-black">{howToApply.deadline || 'View Link'}</p>
               </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Job Description
            </h2>
            <div className="text-slate-700 leading-relaxed text-lg space-y-4 font-medium whitespace-pre-wrap">
              {job.content_en}
            </div>
          </section>

          {/* Eligibility Table */}
          <section className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Eligibility Criteria</h2>
            <div className="grid gap-6">
                <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-bold uppercase text-xs">Official Vacancies</span>
                    <span className="text-slate-900 font-black">{eligibility.vacancies || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-bold uppercase text-xs">Education/Qualification</span>
                    <span className="text-slate-900 font-black">{eligibility.qualification || 'As per official norm'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-bold uppercase text-xs">Age Limit</span>
                    <span className="text-slate-900 font-black">{eligibility.age_limit || 'N/A'}</span>
                </div>
            </div>
          </section>

          {/* How to Apply */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-black rounded-full"></span>
                How to Apply for this Post
            </h2>
            <div className="space-y-4">
              {howToApply.steps?.map((step: string, i: number) => (
                <div key={i} className="flex gap-4 items-start p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 font-bold leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-10 flex flex-col items-center">
            {job.official_url && (
                <a 
                    href={job.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-blue-600 hover:bg-black text-white px-12 py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-blue-200 hover:shadow-black/20 flex items-center gap-4"
                >
                    Official Recruitment Link 🚀
                </a>
            )}
            <p className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Apply before {howToApply.deadline || 'Closing Date'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


