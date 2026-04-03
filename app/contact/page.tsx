import { Navbar } from '@/components/Navbar';

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
    <div className="page-container py-16 text-slate-800 max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Contact Us</h1>
      <p className="text-lg leading-relaxed text-slate-600 mb-8">
        Have questions about the platform, encountered a technical issue, or want to suggest a new government scheme? 
        We are here to help!
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-8 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Reach out directly</h2>
          <ul className="space-y-4 text-slate-600">
            <li className="flex items-center gap-3">
              <span className="text-brand-500 text-xl flex-shrink-0">📧</span>
              <span><strong>Email:</strong> <a href="mailto:contact@schemeatlas.com" className="text-brand-500 underline hover:text-brand-600">contact@schemeatlas.com</a></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-brand-500 text-xl flex-shrink-0">🌐</span>
              <span><strong>Website:</strong> <a href="https://schemeatlas.com" className="text-brand-500 underline hover:text-brand-600">schemeatlas.com</a></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-brand-500 text-xl flex-shrink-0">📍</span>
              <span><strong>Headquarters:</strong> Global Distributed Team</span>
            </li>
          </ul>
        </div>
        
        <div className="card p-8 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Scheme Corrections</h2>
          <p className="text-slate-600 text-sm mb-4">
            If you notice incorrect information about a scheme, please email us with:
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-brand-500">•</span>
              <span>The <strong>scheme name</strong> and what needs correction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500">•</span>
              <span>The <strong>official source URL</strong> with the correct information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500">•</span>
              <span>Your email so we can follow up if needed</span>
            </li>
          </ul>
          <a href="mailto:contact@schemeatlas.com?subject=Scheme%20Correction" className="btn-primary mt-6 inline-block text-sm">
            Report a Correction
          </a>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-8">
        <p className="text-amber-800 text-sm">
          <strong>📌 Note:</strong> SchemeAtlas is an independent, non-governmental platform. We cannot process government scheme applications. 
          For official help, please contact the respective government office or portal linked on each scheme page.
        </p>
      </div>
    </div>
    </div>
  );
}
