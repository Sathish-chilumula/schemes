import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1a1c2e] text-slate-300 py-16 mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-white font-bold text-2xl mb-6">SchemeAtlas</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              India's largest independent platform for government schemes, benefits, and financial aid discovery.
            </p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Independence Notice</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Not affiliated with any government body. Information is for reference only.
              </p>
            </div>
          </div>
          
          {/* Column 2: Popular States */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">States</h4>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              <li><Link href="/in/andhra-pradesh" className="hover:text-white transition-colors">Andhra Pradesh</Link></li>
              <li><Link href="/in/delhi" className="hover:text-white transition-colors">Delhi</Link></li>
              <li><Link href="/in/gujarat" className="hover:text-white transition-colors">Gujarat</Link></li>
              <li><Link href="/in/karnataka" className="hover:text-white transition-colors">Karnataka</Link></li>
              <li><Link href="/in/maharashtra" className="hover:text-white transition-colors">Maharashtra</Link></li>
              <li><Link href="/in/tamil-nadu" className="hover:text-white transition-colors">Tamil Nadu</Link></li>
              <li><Link href="/in/uttar-pradesh" className="hover:text-white transition-colors">Uttar Pradesh</Link></li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Categories</h4>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              <li><Link href="/in?category=Farmers" className="hover:text-white transition-colors">🌾 Farmers</Link></li>
              <li><Link href="/in?category=Students" className="hover:text-white transition-colors">🎓 Students</Link></li>
              <li><Link href="/in?category=Women" className="hover:text-white transition-colors">👩 Women</Link></li>
              <li><Link href="/in?category=Healthcare" className="hover:text-white transition-colors">❤️ Healthcare</Link></li>
              <li><Link href="/in?category=Business" className="hover:text-white transition-colors">💼 MSME & Biz</Link></li>
              <li><Link href="/jobs" className="hover:text-white transition-colors">🏛️ Govt Jobs</Link></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/schemes" className="hover:text-white transition-colors">All Schemes</Link></li>
              <li><Link href="/articles" className="hover:text-white transition-colors">Money Guides</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">Latest News</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-white transition-colors">XML Sitemap</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SchemeAtlas. All rights reserved.</p>
          <p>Built for financial inclusion and transparency.</p>
        </div>
      </div>
    </footer>
  );
}
