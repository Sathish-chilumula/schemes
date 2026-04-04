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

  const navClasses = isDark
    ? 'absolute top-0 left-0 right-0 z-[60] glass-nav-dark border-b border-white/5'
    : 'bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-[60]';

  const logoTextColor = isDark ? 'text-white' : 'text-slate-900';
  const linkColor = isDark
    ? 'text-slate-300 hover:text-white'
    : 'text-slate-600 hover:text-brand-600';
  const savedLinkColor = isDark
    ? 'text-slate-300 hover:text-amber-400'
    : 'text-slate-600 hover:text-amber-500';

  const navLinks = [
    { href: '/schemes', label: 'All Schemes' },
    { href: '/saved', label: '🔖 Saved', isSaved: true },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className={navClasses}>
      <div className="page-container h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className={`font-bold text-xl tracking-tight ${logoTextColor}`}>SchemeAtlas</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${link.isSaved ? savedLinkColor : linkColor}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Auth: Show user or sign in */}
          {!loading && (
            user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors rounded-full py-1.5 px-3 ${
                    isDark
                      ? 'text-white hover:bg-white/10'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDark
                      ? 'bg-brand-500/30 text-brand-200 border border-brand-400/30'
                      : 'bg-brand-100 text-brand-600 border border-brand-200'
                  }`}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/signup"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-base">👤</span> My Profile
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-base">🔖</span> Saved Schemes
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="text-base">🚪</span> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/signup"
                className={`text-sm font-semibold transition-colors hidden sm:block ${
                  isDark ? 'text-white hover:text-brand-300' : 'text-slate-700 hover:text-brand-600'
                }`}
              >
                Sign In
              </Link>
            )
          )}
          
          <div className={isDark ? 'text-white' : 'text-slate-700'}>
            <CountrySwitcher />
          </div>
          <Link
            href="/in/check"
            className="btn-primary text-sm py-2 px-5 !shadow-brand-500/40 hidden sm:inline-flex"
          >
            Check Eligibility →
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t animate-fade-in ${
            isDark
              ? 'bg-slate-900/95 backdrop-blur-xl border-white/10'
              : 'bg-white/95 backdrop-blur-xl border-slate-200/60'
          }`}
        >
          <div className="page-container py-4 space-y-1">
            {/* Mobile: Show user info or sign in */}
            {user ? (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${
                isDark ? 'bg-white/5' : 'bg-brand-50 border border-brand-100'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDark ? 'bg-brand-500/30 text-brand-200' : 'bg-brand-100 text-brand-600'
                }`}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                </div>
              </div>
            ) : (
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors mt-2 border border-slate-200/50 ${
                  isDark
                    ? 'text-brand-300 hover:bg-white/10'
                    : 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                }`}
              >
                Sign In
              </Link>
            )}
            
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isDark
                    ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile: Logout button if logged in */}
            {user && (
              <button
                onClick={handleLogout}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isDark
                    ? 'text-red-400 hover:bg-white/10'
                    : 'text-red-500 hover:bg-red-50'
                }`}
              >
                🚪 Sign Out
              </button>
            )}

            <Link
              href="/in/check"
              onClick={() => setMobileMenuOpen(false)}
              className="block sm:hidden btn-primary text-center text-sm py-3 px-5 mt-3"
            >
              Check Eligibility →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
