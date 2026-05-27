"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import India from '@svg-maps/india';
import { SVGMap } from 'react-svg-map';
import 'react-svg-map/lib/index.css';

export function IndiaMap() {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const handleLocationClick = (event: any) => {
    const stateId = event.target.id;
    // Route to the state scheme page
    if (stateId) {
      router.push(`/in/${stateId}`);
    }
  };

  const handleLocationMouseOver = (event: any) => {
    const stateName = event.target.getAttribute('name');
    setHoveredState(stateName);
  };

  const handleLocationMouseOut = () => {
    setHoveredState(null);
  };

  return (
    <div className="relative w-full flex items-center justify-center min-h-[380px]">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative z-10 w-full max-w-[400px]" aria-label="Interactive map of India — click a state to browse its schemes">
        <SVGMap 
          map={India} 
          onLocationClick={handleLocationClick}
          onLocationMouseOver={handleLocationMouseOver}
          onLocationMouseOut={handleLocationMouseOut}
        />
        
        {hoveredState && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-none whitespace-nowrap transition-all z-20">
            {hoveredState} Schemes →
          </div>
        )}
      </div>

      <style jsx global>{`
        .svg-map {
          width: 100%;
          height: auto;
          stroke: #FF6B00;
          stroke-width: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 8px 24px rgba(255,107,0,0.12));
        }
        .svg-map__location {
          fill: rgba(255,107,0,0.08);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .svg-map__location:focus,
        .svg-map__location:hover {
          fill: rgba(255,107,0,0.3);
          stroke: #FF6B00;
          stroke-width: 2;
          outline: 0;
        }
      `}</style>

      {/* Map caption */}
      <div className="absolute bottom-[-10px] left-0 right-0 text-center z-10">
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Click any state to browse its schemes</span>
      </div>
    </div>
  );
}
