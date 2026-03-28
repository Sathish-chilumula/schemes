'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/config';

export function LocationDetector() {
  const router = useRouter();
  const [showModal, setShowModal] = [false as boolean, (v: boolean) => setShowModalState(v)];
  const [_showModal, setShowModalState] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ country: string, countryName: string, stateName: string } | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  
  // For manual change
  const [selectedCountry, setSelectedCountry] = useState('IN');
  
  useEffect(() => {
    // Only run if user hasn't seen the prompt yet
    const hasPrompted = localStorage.getItem('locationPrompted');
    if (hasPrompted) return;

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const code = data.country_code.toUpperCase();
          // If we support this country, prompt them
          if (COUNTRIES[code]) {
            setDetectedLocation({
              country: code,
              countryName: data.country_name || COUNTRIES[code].name,
              stateName: data.region || ''
            });
            setShowModalState(true);
          }
        }
      })
      .catch(console.error); // Silently fail on adblockers/network issues
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('locationPrompted', 'true');
    setShowModalState(false);
    if (detectedLocation) {
      router.push(`/${detectedLocation.country}`);
    }
  };

  const handleSaveChange = () => {
    localStorage.setItem('locationPrompted', 'true');
    setShowModalState(false);
    router.push(`/${selectedCountry}`);
  };

  if (!_showModal || !detectedLocation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        {/* Header styling */}
        <div className="bg-brand-50 border-b border-brand-100 p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-brand-100">
            {COUNTRIES[detectedLocation.country]?.flag || '🌍'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">Welcome to SchemeAtlas</h2>
          <p className="text-slate-500 text-sm mt-1">Let's find schemes specifically for you.</p>
        </div>

        <div className="p-6">
          {!isChanging ? (
            <div className="text-center">
              <p className="text-slate-700 font-medium text-lg leading-snug mb-8">
                We detected that you are browsing from <br/>
                <strong className="text-brand-600 block mt-2 text-xl">
                  {detectedLocation.stateName ? `${detectedLocation.stateName}, ` : ''}{detectedLocation.countryName}
                </strong>
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirm}
                  className="btn-primary w-full py-3.5 text-base"
                >
                  Yes, show schemes here
                </button>
                <button 
                  onClick={() => setIsChanging(true)}
                  className="btn-secondary w-full py-3.5 text-base border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-none"
                >
                  Change Location
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <label className="form-label text-left mb-2">Select your Country</label>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="form-select mb-6"
              >
                {Object.entries(COUNTRIES).map(([code, config]) => (
                  <option key={code} value={code}>
                    {config.flag} {config.name}
                  </option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsChanging(false)}
                  className="btn-secondary w-1/3 py-3 shadow-none border-transparent bg-slate-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleSaveChange}
                  className="btn-primary flex-1 py-3"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
