'use client';

import { useEffect } from 'react';

export function GoogleTranslate() {
  useEffect(() => {
    // Add Google Translate Script if it doesn't exist
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          { 
            pageLanguage: 'en',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-white rounded-lg shadow-xl shadow-brand-500/20 border border-slate-200 overflow-hidden">
      <div id="google_translate_element" className="translate-widget" />
    </div>
  );
}
