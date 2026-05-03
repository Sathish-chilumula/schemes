'use client';

import { useState } from 'react';

const defaultFaqData = [
  {
    q: "How to earn money online in India without investment?",
    a: "You can start with government-backed PMKVY skill training — it's completely free and provides a stipend while you learn. After that, platforms like Fiverr, Upwork, and YouTube are popular with Indians earning from home. Read our full guide for step-by-step earning paths."
  },
  {
    q: "Which bank gives the best personal loan interest rate in India?",
    a: "As of 2025, HDFC Bank offers personal loans starting at 10.75% p.a. and SBI from 11% p.a. Government employees and those with 750+ CIBIL scores get the best rates. Compare your options with our complete loans guide."
  },
  {
    q: "Is Ayushman Bharat health insurance really free for everyone?",
    a: "Ayushman Bharat PM-JAY covers families listed in the SECC 2011 database — it is not for everyone. You can check your eligibility in under 2 minutes using your Aadhaar or ration card number on our Eligibility Check page."
  },
  {
    q: "What is the best term insurance plan to buy in India in 2025?",
    a: "LIC Tech Term, HDFC Click 2 Protect, and Max Life Smart Secure Plus consistently rank highest with 99%+ claim settlement ratios. Your age, sum assured needed and premium budget will determine the best pick for you."
  }
];

export function FAQAccordion({ faqs }: { faqs?: { q: string, a: string }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqData = faqs && faqs.length > 0 ? faqs : defaultFaqData;

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          })
        }}
      />
      
      <div className="flex flex-col gap-[10px]">
        {faqData.map((faq, index) => {
          const isActive = activeIndex === index;
          return (
            <div 
              key={index} 
              className={`bg-white rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden transition-shadow duration-200 ${isActive ? 'shadow-[var(--shadow-sm)]' : ''}`}
            >
              <div 
                className="flex justify-between items-center p-[16px_20px] cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="font-[600] text-[14px] text-[var(--text-primary)] pr-4">{faq.q}</h3>
                <span className="text-[20px] text-[var(--indigo)] font-[300] select-none shrink-0">
                  {isActive ? '−' : '+'}
                </span>
              </div>
              
              {isActive && (
                <div className="p-[12px_20px_18px] text-[13px] text-[var(--text-muted)] leading-[1.75] border-t border-[#F3F4F6] animate-fade-in" dangerouslySetInnerHTML={{ __html: faq.a }}>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
