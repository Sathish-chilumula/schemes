'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  /** Use 'dark' for hero overlay (homepage), 'light' for standard pages */
  variant?: 'dark' | 'light';
}

export function Navbar({ variant = 'light' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const isDark = variant === 'dark';

  const navWrapperClass = isDark
    ? 'absolute top-0 left-0 right-0 z-[100] bg-[var(--navy)] border-b border-[rgba(255,255,255,0.1)]'
    : 'sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-[var(--border)] shadow-[0_1px_12px_rgba(0,0,0,0.05)]';

  const logoColor = isDark ? 'text-white' : 'text-[var(--text-primary)]';
  const navItemClass = `px-[14px] py-[8px] rounded-[var(--radius-sm)] text-[14px] font-[600] cursor-pointer transition-colors whitespace-nowrap ${isDark ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-[var(--text-primary)] hover:bg-[var(--indigo-light)] hover:text-[var(--indigo)]'}`;

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Announcement Bar — slim single line */}
      <div className="bg-[var(--navy)] py-[5px] text-[12px] text-[#94A3B8] text-center leading-none">
        <span>🇮🇳 1815+ Active Central &amp; State Schemes · Updated Daily &nbsp;·&nbsp;</span>
        <Link href="/articles" className="text-[var(--amber)] font-[700] hover:underline">
          ✦ New: Loans &amp; Insurance Guides →
        </Link>
      </div>

      <nav className={`${navWrapperClass} h-[60px]`}>
        <div className="max-w-[1200px] mx-auto px-[24px] flex items-center h-full relative gap-[6px] justify-between">

          <div className="flex items-center gap-[6px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-[8px] mr-[16px]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-mid)] flex items-center justify-center text-[18px]">
                🗺️
              </div>
              <span className={`font-[800] text-[18px] tracking-[-0.5px] font-[var(--font-heading)] ${logoColor}`}>
                Scheme<span className="text-[var(--indigo)]">Atlas</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-[6px]">
              {/* Mega Menu: Schemes */}
              <div className="group relative">
                <div className={navItemClass}>
                  Schemes ▾
                </div>
                {/* Dropdown panel */}
                <div className="absolute top-[50px] left-1/2 -translate-x-1/2 bg-white rounded-[var(--radius-lg)] p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.14)] border border-[var(--border)] min-w-[700px] z-[999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto" style={{animation: 'megaDown 0.18s ease'}}>
                  <div className="grid grid-cols-3 gap-[28px]">
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">By Category</span>
                      <Link href="/in?category=Farmers" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🌾 Farmers &amp; Agriculture</Link>
                      <Link href="/in?category=Students" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🎓 Scholarships &amp; Education</Link>
                      <Link href="/in?category=Healthcare" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">❤️ Health &amp; Insurance</Link>
                      <Link href="/in?category=Business" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💼 Business &amp; Startup</Link>
                      <Link href="/in?category=Women" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">👩 Women Empowerment</Link>
                      <Link href="/in?category=Housing" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏘️ Housing &amp; Land</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Browse by State</span>
                      <Link href="/in/delhi" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏙️ Delhi</Link>
                      <Link href="/in/andhra-pradesh" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏛️ Andhra Pradesh</Link>
                      <Link href="/in/karnataka" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💻 Karnataka</Link>
                      <Link href="/in/kerala" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🌴 Kerala</Link>
                      <Link href="/in/maharashtra" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏙️ Maharashtra</Link>
                      <Link href="/in/uttar-pradesh" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🕌 Uttar Pradesh</Link>
                      <Link href="/schemes" className="text-[var(--indigo)] font-[700] text-[13px] mt-[8px] block pl-[10px]">View all 28 states →</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Trending Now</span>
                      <Link href="/schemes/ayushman-bharat-pmjay" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 Ayushman Bharat</Link>
                      <Link href="/schemes/pm-awas-yojana-urban" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 PM Awas Yojana</Link>
                      <Link href="/schemes/pm-kisan-samman-nidhi" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 PM Kisan Samman</Link>
                      <Link href="/schemes/pradhan-mantri-mudra-yojana" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 Mudra Loan</Link>
                      <Link href="/schemes/sukanya-samriddhi-yojana" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 Sukanya Samriddhi</Link>
                      <Link href="/schemes/jan-dhan-yojana" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🔥 Jan Dhan Yojana</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mega Menu: Money Guides */}
              <div className="group relative">
                <div className={navItemClass}>
                  Money Guides ▾
                </div>
                <div className="absolute top-[50px] left-1/2 -translate-x-1/2 bg-white rounded-[var(--radius-lg)] p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.14)] border border-[var(--border)] min-w-[700px] z-[999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto" style={{animation: 'megaDown 0.18s ease'}}>
                  <div className="grid grid-cols-3 gap-[28px]">
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Earn Money</span>
                      <Link href="/articles?category=Earn%20Money" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💰 All Earning Guides</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Loans</span>
                      <Link href="/articles?category=Loans" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏦 Loan Guides &amp; Tips</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Insurance &amp; Invest</span>
                      <Link href="/articles?category=Insurance" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🛡️ Insurance Guides</Link>
                      <Link href="/articles?category=Investment" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">📊 Investment Strategies</Link>
                      <Link href="/articles?category=Tax" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💹 Tax Saving Tips</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jobs — direct link, no dropdown */}
              <Link href="/jobs" className={navItemClass}>
                Jobs
              </Link>

              {/* Global Countries Dropdown */}
              <div className="group relative">
                <div className={navItemClass}>🌍 Global ▾</div>
                <div className="absolute top-[50px] right-0 bg-white rounded-[var(--radius-lg)] p-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.14)] border border-[var(--border)] min-w-[300px] z-[999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Browse by Country</span>
                  {([
                    { href: '/in', flag: '🇮🇳', label: 'India', sub: 'PM schemes, State schemes' },
                    { href: '/us', flag: '🇺🇸', label: 'United States', sub: 'SNAP, Medicaid, Section 8' },
                    { href: '/gb', flag: '🇬🇧', label: 'United Kingdom', sub: 'Universal Credit, PIP' },
                    { href: '/ca', flag: '🇨🇦', label: 'Canada', sub: 'CPP, OAS, EI, CCB' },
                    { href: '/au', flag: '🇦🇺', label: 'Australia', sub: 'Centrelink, NDIS' },
                    { href: '/eu', flag: '🇪🇺', label: 'European Union', sub: 'Horizon Europe, Erasmus+' },
                  ] as {href:string;flag:string;label:string;sub:string}[]).map(c => (
                    <Link key={c.href} href={c.href} className="flex items-center gap-[10px] px-[10px] py-[8px] rounded-[var(--radius-sm)] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">
                      <span className="text-[20px]">{c.flag}</span>
                      <div>
                        <div className="text-[13px] font-[600]">{c.label}</div>
                        <div className="text-[11px] text-[var(--text-faint)]">{c.sub}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* Right Side */}
          <div className="flex items-center gap-[12px]">
            {/* Auth Dropdown */}
            {!loading && user ? (
              <div className="relative hidden sm:block">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 text-sm font-semibold transition-colors rounded-[var(--radius-sm)] py-1.5 px-3 hover:bg-[var(--indigo-light)] text-[var(--text-primary)]">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--indigo-light)] text-[var(--indigo)] border border-[var(--border)]">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </button>
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--border)] py-2 z-50">
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="text-[14px] font-[700] text-[var(--text-primary)] truncate">{user.name}</p>
                        <p className="text-[12px] text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-[600] text-red-600 hover:bg-red-50">🚪 Sign Out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/signup" className={`text-[13px] font-[600] hidden sm:block ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>Sign In</Link>
            )}

            {/* CTA — saffron pill */}
            <Link
              href="/in/check"
              className="hidden sm:flex items-center justify-center bg-[#FF6B00] hover:bg-[#E55C00] text-white font-[700] rounded-[var(--radius-sm)] py-[8px] px-[16px] text-[13px] transition-all shadow-[0_4px_12px_rgba(255,107,0,0.25)] hover:shadow-[0_6px_16px_rgba(255,107,0,0.35)] hover:-translate-y-[1px]"
            >
              Check Eligibility →
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-[24px] cursor-pointer"
              style={{ color: isDark ? 'white' : 'var(--text-primary)' }}
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer — with slide-in animation */}
      <div
        className={`fixed inset-0 z-[200] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className="absolute top-0 right-0 h-[100vh] w-full max-w-[300px] bg-white p-[28px_24px] shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
          style={{
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-[24px]">
            <Link href="/" className="flex items-center gap-[8px]" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-mid)] flex items-center justify-center text-[16px]">🗺️</div>
              <span className="font-[800] text-[16px] text-[var(--text-primary)]">Scheme<span className="text-[var(--indigo)]">Atlas</span></span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="text-[24px] text-[var(--text-primary)]">✕</button>
          </div>

          <div className="flex flex-col gap-[8px] flex-1 overflow-y-auto">
            <div className="py-[14px] border-b border-[var(--border)] flex flex-col gap-3">
              <Link href="/articles" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)]">Money Guides</Link>
              <div className="flex flex-col gap-3 pl-4">
                <Link href="/articles?category=Loans" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">🏦 Loans</Link>
                <Link href="/articles?category=Insurance" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">🛡️ Insurance</Link>
                <Link href="/articles?category=Earn%20Money" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">💰 Earn Money</Link>
                <Link href="/articles?category=Investment" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">📊 Investment</Link>
              </div>
            </div>

            <div className="py-[14px] border-b border-[var(--border)] flex flex-col gap-3">
              <Link href="/schemes" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)]">All Schemes</Link>
              <div className="flex flex-col gap-3 pl-4">
                <Link href="/in?category=Farmers" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">🌾 Farmers &amp; Agriculture</Link>
                <Link href="/in?category=Students" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">🎓 Scholarships &amp; Education</Link>
                <Link href="/in?category=Healthcare" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">❤️ Health &amp; Insurance</Link>
                <Link href="/in?category=Business" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[var(--text-muted)]">💼 Business &amp; Startup</Link>
              </div>
            </div>

            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">💼 Jobs</Link>

            <Link href="/in/check" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--indigo)] py-[14px] border-b border-[var(--border)]">Eligibility Check ✨</Link>

            {!loading && user ? (
              <button onClick={handleLogout} className="text-[16px] font-[600] text-red-600 py-[14px] border-b border-[var(--border)] text-left">Sign Out</button>
            ) : (
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">Sign In</Link>
            )}
          </div>

          {/* Mobile drawer footer */}
          <div className="mt-[16px] pt-[14px] border-t border-[var(--border)] flex flex-col gap-[10px]">
            <Link href="/in/check" onClick={() => setMobileMenuOpen(false)} className="btn-saffron w-full text-center" style={{ background: '#FF6B00', color: 'white' }}>
              ✓ Check Eligibility
            </Link>
            <Link href="/gb" onClick={() => setMobileMenuOpen(false)} className="text-[13px] text-[var(--text-muted)] text-center hover:text-[var(--indigo)] transition-colors">
              🇬🇧 Also: UK Schemes →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
