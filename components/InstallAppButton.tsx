'use client';

import { useState, useEffect } from 'react';

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) {
    return (
      <button 
        className="w-full text-left text-slate-400 hover:text-white transition-colors cursor-not-allowed opacity-50"
        title="App already installed or not supported on this browser"
      >
        📱 Install App (Unavailable)
      </button>
    );
  }

  return (
    <button 
      onClick={handleInstallClick}
      className="w-full text-left text-indigo-400 hover:text-indigo-300 font-[600] transition-colors flex items-center gap-[6px]"
    >
      📱 Install App (PWA)
    </button>
  );
}
