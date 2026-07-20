import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ background: '#0F172A' }} className="text-slate-300 py-16 mt-16 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-[24px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1 — About SchemeAtlas */}
          <div>
            {/* Logo */}
            <div className="flex items-center gap-[8px] mb-[14px]">
              <div className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-[16px]">
                🗺️
              </div>
              <span className="font-[800] text-[18px] tracking-[-0.5px] text-white">
                Scheme<span className="text-indigo-400">Atlas</span>
              </span>
            </div>

            <p className="text-[13px] text-slate-400 mb-[20px] leading-relaxed">
              India&apos;s most comprehensive government schemes platform. Plus expert guides on loans, insurance and earning opportunities.
            </p>

            {/* Language availability note */}
            <p className="text-[12px] text-slate-500 mb-[18px] leading-relaxed">
              🌐 Available in English, हिंदी, తెలుగు, தமிழ், বাংলা &amp; more.
            </p>


            {/* Country switcher */}
            <div className="flex flex-col gap-[6px]">
              <Link href="/gb" className="inline-flex items-center gap-[6px] text-[13px] text-indigo-400 hover:text-indigo-300 font-[600] transition-colors">
                🇬🇧 Also: UK Schemes →
              </Link>
              <span className="inline-flex items-center gap-[6px] text-[13px] text-slate-500 cursor-not-allowed">
                🇺🇸 US Schemes <span className="text-[10px] bg-slate-700 text-slate-400 rounded-[4px] px-[5px] py-[1px]">Soon</span>
              </span>
            </div>
          </div>

          {/* Column 2 — States */}
          <div>
            <h4 className="text-white font-[700] mb-[20px] uppercase tracking-[1.5px] text-[11px]">States</h4>
            <ul className="flex flex-col gap-[9px] text-[13px]">
              <li><Link href="/in/andhra-pradesh" className="text-slate-400 hover:text-white transition-colors">Andhra Pradesh</Link></li>
              <li><Link href="/in/delhi" className="text-slate-400 hover:text-white transition-colors">Delhi</Link></li>
              <li><Link href="/in/gujarat" className="text-slate-400 hover:text-white transition-colors">Gujarat</Link></li>
              <li><Link href="/in/karnataka" className="text-slate-400 hover:text-white transition-colors">Karnataka</Link></li>
              <li><Link href="/in/maharashtra" className="text-slate-400 hover:text-white transition-colors">Maharashtra</Link></li>
              <li><Link href="/in/tamil-nadu" className="text-slate-400 hover:text-white transition-colors">Tamil Nadu</Link></li>
              <li><Link href="/in/uttar-pradesh" className="text-slate-400 hover:text-white transition-colors">Uttar Pradesh</Link></li>
              <li><Link href="/in/west-bengal" className="text-slate-400 hover:text-white transition-colors">West Bengal</Link></li>
            </ul>
            <Link href="/schemes" className="text-indigo-400 hover:text-indigo-300 font-[600] text-[13px] mt-[14px] block transition-colors">
              View all 28 states →
            </Link>
          </div>

          {/* Column 3 — Categories */}
          <div>
            <h4 className="text-white font-[700] mb-[20px] uppercase tracking-[1.5px] text-[11px]">Categories</h4>
            <ul className="flex flex-col gap-[9px] text-[13px]">
              <li><Link href="/in?category=Farmers" className="text-slate-400 hover:text-white transition-colors">🌾 Farmers</Link></li>
              <li><Link href="/in?category=Students" className="text-slate-400 hover:text-white transition-colors">🎓 Students</Link></li>
              <li><Link href="/in?category=Women" className="text-slate-400 hover:text-white transition-colors">👩 Women</Link></li>
              <li><Link href="/in?category=Healthcare" className="text-slate-400 hover:text-white transition-colors">❤️ Healthcare</Link></li>
              <li><Link href="/in?category=Business" className="text-slate-400 hover:text-white transition-colors">💼 Business &amp; MSME</Link></li>
              <li><Link href="/in?category=SC-ST" className="text-slate-400 hover:text-white transition-colors">🤝 SC/ST</Link></li>
              <li><Link href="/in?category=Housing" className="text-slate-400 hover:text-white transition-colors">🏘️ Housing</Link></li>
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <h4 className="text-white font-[700] mb-[20px] uppercase tracking-[1.5px] text-[11px]">Legal</h4>
            <ul className="flex flex-col gap-[9px] text-[13px]">
              <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/editorial-policy" className="text-slate-400 hover:text-white transition-colors">Editorial Policy</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="/sitemap.xml" className="text-slate-400 hover:text-white transition-colors">XML Sitemap</Link></li>
              <li className="pt-2 mt-2 border-t border-white/10"><span className="text-[13px] text-slate-500">📱 App <span className="text-[10px] bg-slate-700 text-slate-400 rounded-[4px] px-[5px] py-[1px] ml-1">Coming Soon</span></span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-[56px] pt-[24px] border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-[12px] text-[12px] text-slate-500">
          <p>© 2026 SchemeAtlas, Hyderabad, India. Not affiliated with any government entity.</p>
          <p className="font-[600] text-slate-400">Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>

  );
}
