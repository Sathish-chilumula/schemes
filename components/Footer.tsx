import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1a1c2e] text-slate-300 py-12 mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-xl mb-4">SchemeAtlas</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Discover and apply for government schemes, benefits, and financial aid with ease. Find what you qualify for in minutes.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/schemes" className="hover:text-white transition-colors">All Schemes</Link></li>
            <li><Link href="/articles" className="hover:text-white transition-colors">Guides & Articles</Link></li>
            <li><Link href="/news" className="hover:text-white transition-colors">Latest News</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Legal & Info</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Disclaimer</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            SchemeAtlas is an independent informational platform and is NOT affiliated with any government body. Information provided is for reference purposes.
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SchemeAtlas. All rights reserved.
      </div>
    </footer>
  );
}
