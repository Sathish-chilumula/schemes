import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About SchemeAtlas – India\'s Trusted Government Scheme Directory',
  description: 'SchemeAtlas was built in Hyderabad to help every Indian citizen find the government schemes and benefits they deserve. Learn about our mission, team, and editorial process.',
  alternates: { canonical: 'https://schemeatlas.com/about' },
};

const TEAM = [
  {
    name: 'Sathish Kumar',
    role: 'Founder & Editor-in-Chief',
    bio: 'Former government services researcher from Andhra Pradesh. Spent 4+ years documenting welfare schemes across 15 Indian states. Built SchemeAtlas after watching his own family miss out on benefits they qualified for.',
    icon: '👨‍💻',
    location: 'Hyderabad, Telangana',
  },
  {
    name: 'Content Research Team',
    role: 'Scheme Verification & Updates',
    bio: 'Our research team manually verifies each scheme against official government portals — including myscheme.gov.in, PIB press releases, and individual state government websites — before publishing.',
    icon: '🔍',
    location: 'Hyderabad & Remote',
  },
  {
    name: 'Advisory Panel',
    role: 'Policy & Eligibility Review',
    bio: 'A panel of retired government officers and social welfare advocates review our eligibility criteria summaries for accuracy, especially for complex state-level schemes.',
    icon: '🏛️',
    location: 'Across India',
  },
];

const MILESTONES = [
  { year: 'March 2026', event: 'SchemeAtlas launched with 800+ verified Indian government schemes' },
  { year: 'April 2026', event: 'Expanded to cover all 28 Indian states and 8 Union Territories' },
  { year: 'May 2026', event: 'Reached 1,815+ schemes and added multilingual content (Hindi, Telugu)' },
  { year: 'May 2026', event: '8,000+ citizens visited the platform in the first month of public availability' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-green-50 border-b border-slate-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-orange-200">
            🇮🇳 Made in Hyderabad, India
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
            We Built SchemeAtlas Because<br />
            <span className="text-orange-500">Every Rupee of Aid Matters</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Millions of Indians qualify for government schemes — free housing, farm income, 
            health insurance, scholarships — but never claim them. Not because they don't exist. 
            Because nobody told them.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

        {/* Origin Story */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm">📖</span>
            Why We Built This
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4 text-slate-600 leading-relaxed">
            <p>
              In 2025, our founder Sathish Kumar was helping his father — a retired school teacher from Andhra Pradesh — 
              navigate welfare schemes after a health scare. Despite being fully eligible for 
              <strong className="text-slate-800"> Ayushman Bharat</strong> health cover and the 
              <strong className="text-slate-800"> PM Awas Yojana</strong> housing upgrade, 
              his family had never enrolled in either. They simply didn't know.
            </p>
            <p>
              Sathish spent three weeks researching across government websites — many of which were 
              outdated, inaccessible on mobile, or only available in English. He found that the 
              information existed, but it was scattered, technical, and hard to act on.
            </p>
            <p className="font-semibold text-slate-800 border-l-4 border-orange-400 pl-4 py-2 bg-orange-50 rounded-r-lg">
              "If a researcher couldn't navigate this system easily, how was an ordinary farmer in 
              Nalgonda or a widowed woman in Vizianagaram supposed to?" — Sathish Kumar, Founder
            </p>
            <p>
              SchemeAtlas was built to fix that. One clear, accurate, mobile-friendly page for every 
              government scheme in India — written in plain language, updated regularly, and available 
              in Hindi and Telugu alongside English.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm">🎯</span>
            What SchemeAtlas Does
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '📋',
                title: 'Scheme Discovery',
                desc: '1,815+ central and state government schemes, verified against official portals. Every scheme has eligibility criteria, benefit amounts, and application steps.',
                color: '#FF6B00',
              },
              {
                icon: '✅',
                title: 'Eligibility Checker',
                desc: 'Our AI-powered checker lets citizens answer a few questions and instantly see which schemes they qualify for — without registering or sharing personal data.',
                color: '#138808',
              },
              {
                icon: '🌐',
                title: 'Multilingual Guides',
                desc: 'Scheme information available in English, Hindi, and Telugu so that language is never a barrier to accessing welfare information.',
                color: '#1B5FA8',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">👥</span>
            Our Team
          </h2>
          <div className="space-y-4">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-5 items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {member.icon}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{member.name}</h3>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{member.role}</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-2">{member.bio}</p>
                  <span className="text-xs text-slate-400 font-medium">📍 {member.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-sm">📅</span>
            Our Journey So Far
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="space-y-5">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-28 text-xs font-bold text-orange-600 pt-0.5">{m.year}</div>
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400 ring-4 ring-orange-100"></div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Standards callout */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-3">Editorial Standards</h2>
          <p className="text-blue-700 text-sm leading-relaxed mb-4">
            Every scheme on SchemeAtlas is verified against official government sources. We follow strict 
            editorial guidelines to ensure accuracy — including cross-referencing with myscheme.gov.in, 
            PIB press releases, and official state government portals.
          </p>
          <Link
            href="/editorial-policy"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
          >
            Read Our Editorial Policy →
          </Link>
        </section>

        {/* Independence disclaimer */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-900 mb-2">⚠️ Independent, Non-Governmental Platform</h3>
          <p className="text-amber-800 text-sm leading-relaxed">
            SchemeAtlas is a <strong>privately operated educational platform</strong> based in Hyderabad, India. 
            We are not affiliated with, endorsed by, or operated by any government body. All content 
            is aggregated from official public sources for informational purposes only. Always verify 
            details on the official scheme portal before applying.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-4">
          <p className="text-slate-500 mb-4 text-sm">Have questions, corrections, or want to work with us?</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all">
              Contact Us
            </Link>
            <Link href="/editorial-policy" className="bg-white text-slate-900 border-2 border-slate-200 px-6 py-3 rounded-xl font-bold text-sm hover:border-slate-300 transition-all">
              Editorial Policy
            </Link>
            <Link href="/schemes" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all">
              Browse Schemes →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
