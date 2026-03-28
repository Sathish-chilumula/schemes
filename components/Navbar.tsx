'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CountrySwitcher } from './CountrySwitcher';

interface NavbarProps {
  /** Use 'dark' for hero overlay (homepage), 'light' for standard pages */
  variant?: 'dark' | 'light';
}

export function Navbar({ variant = 'light' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Right Side: Sign In + Country Switcher + CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className={`text-sm font-semibold transition-colors hidden sm:block ${
              isDark ? 'text-white hover:text-brand-300' : 'text-slate-700 hover:text-brand-600'
            }`}
          >
            Sign In
          </Link>
          
          <div className={isDark ? 'text-white' : 'text-slate-700'}>
            <CountrySwitcher />
          </div>
          <Link
            href="/IN/check"
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
            <Link
              href="/IN/check"
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
