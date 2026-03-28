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
              <span><strong>Email:</strong> support@schemeatlas.vercel.app</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-brand-500 text-xl flex-shrink-0">📱</span>
              <span><strong>WhatsApp:</strong> +91 (123) 456-7890</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-brand-500 text-xl flex-shrink-0">📍</span>
              <span><strong>Headquarters:</strong> Global Distributed Team</span>
            </li>
          </ul>
        </div>
        
        <form className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Send us a message</h2>
          <input className="form-input w-full bg-slate-50 border-slate-200 p-3 rounded-lg" placeholder="Your Name" />
          <input className="form-input w-full bg-slate-50 border-slate-200 p-3 rounded-lg" type="email" placeholder="Your Email Address" />
          <textarea className="form-input w-full bg-slate-50 border-slate-200 p-3 rounded-lg" rows={4} placeholder="How can we help you?"></textarea>
          <button className="btn-primary w-full py-3">Send Message</button>
        </form>
      </div>
    </div>
    </div>
  );
}
