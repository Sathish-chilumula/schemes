import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
    <div className="page-container py-16 text-slate-800 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">About SchemeAtlas</h1>
      <div className="space-y-6 text-lg leading-relaxed text-slate-600">
        <p>
          Welcome to <strong className="text-brand-500">SchemeAtlas</strong>, your trusted, independent portal dedicated to 
          helping citizens discover exactly which government schemes, assistance programs, and welfare benefits they 
          qualify for globally.
        </p>
        <p>
          We realized that governments worldwide offer trillions of dollars in financial aid, scholarships, housing subsidies, 
          and business grants every year—but millions of citizens miss out simply because they <strong>don't know the programs exist</strong> 
          or find the eligibility criteria too confusing to understand.
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Our Mission</h2>
        <p>
          Our mission is to bridge the gap between complex government policy and the citizens who need it most. 
          By utilizing advanced AI and aggregating data directly from official public sources 
          (including <a href="https://myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline hover:text-brand-600">myscheme.gov.in</a>, PIB, and MyGov), 
          we democratize access to welfare information.
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">What Makes Us Different</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl text-center">
            <span className="text-4xl mb-3 block">🆓</span>
            <h3 className="font-bold text-slate-900 mb-1">100% Free</h3>
            <p className="text-sm text-slate-500">Completely free to browse, search, and check eligibility. No hidden fees, ever.</p>
          </div>
          <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl text-center">
            <span className="text-4xl mb-3 block">🌐</span>
            <h3 className="font-bold text-slate-900 mb-1">Multilingual</h3>
            <p className="text-sm text-slate-500">Scheme guides available in English, Hindi, Telugu, Tamil, Kannada, Marathi and more regional languages.</p>
          </div>
          <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl text-center">
            <span className="text-4xl mb-3 block">🔄</span>
            <h3 className="font-bold text-slate-900 mb-1">Updated Regularly</h3>
            <p className="text-sm text-slate-500">Our AI agents scan official portals daily to keep scheme data accurate and up-to-date.</p>
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-100 p-6 rounded-2xl mt-8">
          <h3 className="font-bold text-brand-800 mb-2">Independent and Non-Governmental</h3>
          <p className="text-brand-700 text-base">
            SchemeAtlas is a privately run educational platform. We are <strong>not affiliated with, endorsed by, or operated by 
            any government agency</strong>. All information provided here is aggregated from thousands of public sources 
            for informational purposes to help educate the public.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 mb-4">Have questions or suggestions?</p>
          <Link href="/contact" className="btn-primary">Contact Us</Link>
        </div>
      </div>
    </div>
    </div>
  );
}
