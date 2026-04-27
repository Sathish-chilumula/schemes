'use client';

import { useState } from 'react';

export function HomeTabs({ 
  indiaContent, 
  globalContent 
}: { 
  indiaContent: React.ReactNode; 
  globalContent: React.ReactNode; 
}) {
  const [activeTab, setActiveTab] = useState<'INDIA' | 'GLOBAL'>('INDIA');

  return (
    <>
      {/* ── INDIA VS GLOBAL TOGGLE ── */}
      <div className="page-container mb-12 flex justify-center">
        <div className="inline-flex bg-slate-200/60 p-1.5 rounded-2xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('INDIA')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'INDIA' ? 'bg-white text-slate-900 shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🇮🇳 Indian Schemes
          </button>
          <button 
            onClick={() => setActiveTab('GLOBAL')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'GLOBAL' ? 'bg-white text-slate-900 shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🌍 Global Schemes
          </button>
        </div>
      </div>

      {activeTab === 'INDIA' && (
        <div className="animate-fade-in">
          {indiaContent}
        </div>
      )}

      {activeTab === 'GLOBAL' && (
        <div className="page-container mb-24 animate-fade-in">
          {globalContent}
        </div>
      )}
    </>
  );
}
