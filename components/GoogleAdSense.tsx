'use client';

import { useEffect } from 'react';

interface GoogleAdSenseProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GoogleAdSense({ slot, className = '', style }: GoogleAdSenseProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`ad-container my-8 text-center overflow-hidden min-h-[100px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center ${className}`}>
      {/* 
          Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your actual AdSense publisher ID in layout.tsx 
          and provide the correct 'slot' ID here.
      */}
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-3809505002238691"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <div className="text-[10px] text-slate-400 absolute uppercase tracking-widest pointer-events-none">
        Advertisement
      </div>
    </div>
  );
}
