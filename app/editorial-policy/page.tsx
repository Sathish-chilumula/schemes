import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Policy | SchemeAtlas — How We Research & Verify Schemes',
  description: 'Learn how SchemeAtlas researches, verifies, and publishes government scheme information. Our editorial standards, sources, update process, and correction policy.',
  alternates: { canonical: 'https://schemeatlas.com/editorial-policy' },
};

const SOURCES = [
  { name: 'myscheme.gov.in', desc: 'Official Government of India scheme repository', url: 'https://myscheme.gov.in' },
  { name: 'pib.gov.in', desc: 'Press Information Bureau — official government press releases', url: 'https://pib.gov.in' },
  { name: 'india.gov.in', desc: 'National Portal of India — citizen services directory', url: 'https://india.gov.in' },
  { name: 'State Government Portals', desc: 'Official portals of all 28 Indian states and 8 UTs', url: '#' },
  { name: 'Ministry Websites', desc: 'Direct ministry portals (Agriculture, Education, Health, etc.)', url: '#' },
  { name: 'Legislative Documents', desc: 'Parliament budget announcements, scheme launch notifications', url: '#' },
];

export default function EditorialPolicy() {
  const lastUpdated = '29 June 2026';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            📋 Transparency Document
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
            Editorial Policy
          </h1>
          <p className="text-slate-500 text-sm">
            Last updated: {lastUpdated} · Published by the SchemeAtlas Editorial Team, Hyderabad, India
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        {/* Mission Statement */}
        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Our Editorial Commitment</h2>
          <p className="text-blue-800 text-sm leading-relaxed">
            SchemeAtlas is committed to publishing <strong>accurate, current, and actionable</strong> information 
            about Indian government schemes. Every page on our platform is created with one goal: to help citizens 
            understand exactly what benefits they qualify for and how to claim them. We do not publish speculative 
            content, opinion, or political commentary. Our focus is strictly factual welfare information sourced 
            from official government portals.
          </p>
        </section>

        {/* How We Research */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">1. How We Research Schemes</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Every scheme on SchemeAtlas begins with a <strong className="text-slate-800">primary source verification</strong>. 
              Our research process follows these steps:
            </p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', title: 'Official Source Identification', desc: 'We locate the official government portal, PIB notification, or legislative document that originally announced the scheme.' },
                { step: '2', title: 'Eligibility Extraction', desc: 'Eligibility criteria, income limits, age requirements, and caste/category conditions are extracted verbatim from official sources and then simplified into plain language.' },
                { step: '3', title: 'Benefit Amount Verification', desc: 'Benefit amounts (cash transfers, subsidies, loan amounts) are verified against the latest official circulars, not news articles or secondary sources.' },
                { step: '4', title: 'Application Process Documentation', desc: 'Application steps are verified by cross-referencing official portals. Where possible, we link directly to the official online application portal.' },
                { step: '5', title: 'Editorial Review', desc: 'A second team member reviews the drafted scheme page for accuracy before it is published.' },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <strong className="text-slate-800">{item.title}:</strong>{' '}
                    {item.desc}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Our Sources */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">2. Our Primary Sources</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {SOURCES.map((source, i) => (
              <div
                key={source.name}
                className={`flex items-start gap-4 p-5 ${i < SOURCES.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm flex-shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-0.5">{source.name}</div>
                  <div className="text-xs text-slate-500">{source.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 px-1">
            We do <strong>not</strong> use news websites, social media posts, or unofficial blogs as primary sources for scheme information.
          </p>
        </section>

        {/* Update Policy */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">3. How We Keep Content Updated</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Government schemes change frequently — benefit amounts are revised in annual budgets, 
              eligibility criteria are updated, and schemes are sometimes discontinued. Our update policy:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              {[
                { label: 'Scheme Status', desc: 'Verified monthly against official portals. Discontinued schemes are marked clearly.' },
                { label: 'Benefit Amounts', desc: 'Updated after each Union Budget and state budget announcement.' },
                { label: 'Eligibility Changes', desc: 'Monitored via PIB alerts and ministry circulars.' },
                { label: 'Application Links', desc: 'Official portal links are checked every 30 days for validity.' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="font-bold text-slate-800 text-xs mb-1">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 italic mt-2">
              Each scheme page displays a "Last verified" date. If you notice outdated information, 
              please report it via our <Link href="/contact" className="text-orange-500 hover:underline">correction form</Link>.
            </p>
          </div>
        </section>

        {/* What We Do Not Publish */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">4. What We Do Not Publish</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <ul className="space-y-3">
              {[
                'Political commentary or opinions on government policy',
                'Speculation about upcoming schemes that have not been officially announced',
                'Scheme applications or government services — we only provide information',
                'User data collection beyond what is necessary for the eligibility checker',
                'Paid promotions disguised as scheme information',
                'Content sourced from unofficial social media or forwarded messages',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="text-red-400 font-bold flex-shrink-0 mt-0.5">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Corrections Policy */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">5. Corrections & Error Reporting</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              Despite our verification process, information can become outdated or contain errors. 
              We take corrections seriously. If you find incorrect information:
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Email us at <a href="mailto:contact@schemeatlas.com" className="text-orange-500 hover:underline font-medium">contact@schemeatlas.com</a> with the subject "Scheme Correction"</li>
              <li>Include the scheme name, the incorrect information, and the official source URL with the correct data</li>
              <li>Our team will review and update within <strong className="text-slate-800">72 hours</strong> for factual errors</li>
              <li>Significant corrections are noted at the bottom of the relevant scheme page</li>
            </ol>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mt-4">
              <p className="text-xs text-orange-800">
                <strong>Important:</strong> SchemeAtlas is an information platform only. We cannot process 
                government applications, verify your eligibility with government databases, or guarantee 
                that you will receive any benefit. Always apply through official government portals.
              </p>
            </div>
          </div>
        </section>

        {/* AI Use Disclosure */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">6. Use of AI in Content Creation</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              In the interest of full transparency, SchemeAtlas uses AI language models to assist in 
              <strong className="text-slate-800"> summarising and formatting</strong> scheme information 
              that has been sourced from official government portals. Specifically:
            </p>
            <ul className="space-y-2">
              {[
                'AI is used to convert complex government policy language into plain, readable English, Hindi, and Telugu',
                'AI-generated summaries are always reviewed against official source documents by our research team before publication',
                'Eligibility criteria, benefit amounts, and official links are always taken directly from government sources — not inferred by AI',
                'AI is not used to fabricate, speculate, or generate scheme details that are not publicly documented',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-slate-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Questions About Our Editorial Process?</h2>
          <p className="text-slate-400 text-sm mb-5">
            We welcome feedback from citizens, journalists, researchers, and government officials.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:contact@schemeatlas.com"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
            >
              📧 contact@schemeatlas.com
            </a>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/20"
            >
              Contact Form →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
