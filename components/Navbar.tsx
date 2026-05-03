'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CountrySwitcher } from './CountrySwitcher';
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
    : 'sticky top-0 z-[100] bg-white border-b border-[var(--border)] shadow-[0_2px_16px_rgba(0,0,0,0.06)]';

  const logoColor = isDark ? 'text-white' : 'text-[var(--text-primary)]';
  const navItemClass = `px-[14px] py-[8px] rounded-[var(--radius-sm)] text-[14px] font-[600] cursor-pointer transition-colors whitespace-nowrap ${isDark ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-[var(--text-primary)] hover:bg-[var(--indigo-light)] hover:text-[var(--indigo)]'}`;

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[var(--navy)] py-[6px] text-[12px] text-[#94A3B8] text-center">
        <div className="max-w-[1200px] mx-auto px-[24px] flex justify-center items-center gap-[16px]">
          <span>🇮🇳 1815+ Active Central & State Schemes · Updated Daily</span>
          <Link href="/articles" className="text-[var(--amber)] font-[700] hover:underline">
            ✦ New: Loans & Insurance Guides →
          </Link>
        </div>
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
                      <Link href="/in?category=Farmers" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🌾 Farmers & Agriculture</Link>
                      <Link href="/in?category=Students" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🎓 Scholarships & Education</Link>
                      <Link href="/in?category=Healthcare" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">❤️ Health & Insurance</Link>
                      <Link href="/in?category=Business" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💼 Business & Startup</Link>
                      <Link href="/in?category=Women" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">👩 Women Empowerment</Link>
                      <Link href="/in?category=Housing" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏘️ Housing & Land</Link>
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
                      <Link href="/articles/earn-money-online-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💰 Earn Money Online</Link>
                      <Link href="/articles/freelancing-guide-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">📱 Freelancing Guide</Link>
                      <Link href="/articles/work-from-home-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏠 Work From Home Jobs</Link>
                      <Link href="/articles/youtube-earnings-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">📹 YouTube Earnings India</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Loans</span>
                      <Link href="/articles/best-personal-loans-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏦 Best Personal Loans</Link>
                      <Link href="/articles/home-loan-guide-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🏠 Home Loan Guide</Link>
                      <Link href="/articles/business-loans-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💼 Business Loans</Link>
                      <Link href="/articles/education-loan-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🎓 Education Loans</Link>
                    </div>
                    <div>
                      <span className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[var(--text-faint)] mb-[10px] block">Insurance & Invest</span>
                      <Link href="/articles/health-insurance-tips-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">🛡️ Health Insurance Tips</Link>
                      <Link href="/articles/term-insurance-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">❤️ Best Term Insurance</Link>
                      <Link href="/articles/lic-vs-private-insurance" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">📊 LIC vs Private Plans</Link>
                      <Link href="/articles/tax-saving-guide-india" className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[var(--radius-sm)] text-[13px] font-[500] hover:bg-[#F0F4FF] hover:text-[var(--indigo)] text-[var(--text-primary)]">💹 Tax Saving Guide</Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/schemes" className={navItemClass}>
                All Schemes
              </Link>
              <Link href="/in/check" className={navItemClass + ' flex items-center gap-1'}>
                Eligibility Check
                <span className="w-[6px] h-[6px] rounded-full bg-[var(--green)] inline-block ml-[2px]"></span>
              </Link>
              <Link href="/saved" className={navItemClass}>
                🔖 Saved
              </Link>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-[12px]">
            {/* Country Switcher (Pill style) */}
            <div className={`border border-[var(--border)] rounded-[var(--radius-sm)] px-[14px] py-[6px] text-[13px] font-[600] ${isDark ? 'text-white border-[rgba(255,255,255,0.2)]' : 'text-[var(--text-primary)]'}`}>
              <CountrySwitcher />
            </div>

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

            <Link href="/in/check" className="btn-primary-new hidden sm:inline-block py-[8px] px-[20px] text-[13px] glow-border">
              ✓ Check Eligibility
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

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-[rgba(0,0,0,0.5)] md:hidden">
          <div className="absolute top-0 right-0 h-[100vh] w-full max-w-[300px] bg-white p-[28px_24px] shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform">
            <div className="flex items-center justify-between mb-[24px]">
              <Link href="/" className="flex items-center gap-[8px]" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-mid)] flex items-center justify-center text-[16px]">🗺️</div>
                <span className="font-[800] text-[16px] text-[var(--text-primary)]">Scheme<span className="text-[var(--indigo)]">Atlas</span></span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[24px] text-[var(--text-primary)]">✕</button>
            </div>

            <div className="flex flex-col gap-[8px] flex-1">
              <Link href="/schemes" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">All Schemes</Link>
              <Link href="/in/check" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">Eligibility Check</Link>
              <Link href="/articles" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">Money Guides</Link>
              <Link href="/saved" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">Saved Schemes</Link>
              
              {!loading && user ? (
                <button onClick={handleLogout} className="text-[16px] font-[600] text-red-600 py-[14px] border-b border-[var(--border)] text-left">Sign Out</button>
              ) : (
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="text-[16px] font-[600] text-[var(--text-primary)] py-[14px] border-b border-[var(--border)]">Sign In</Link>
              )}
            </div>

            <Link href="/in/check" onClick={() => setMobileMenuOpen(false)} className="btn-primary-new w-full text-center mt-auto">
              ✓ Check Eligibility
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
