import Link from 'next/link';

interface Props {
  category: string;
  schemeTitle: string;
}

export function RelatedArticlesBlock({ category, schemeTitle }: Props) {
  const catLower = category.toLowerCase();
  let suggestions = [];

  if (catLower.includes('business') || catLower.includes('loan') || catLower.includes('startup')) {
    suggestions = [
      { title: "Best Business Loans in India 2025", href: "/articles/business-loans-india" },
      { title: "MUDRA Loan: How to Apply Step by Step", href: "/articles/mudra-loan-guide" }
    ];
  } else if (catLower.includes('health') || catLower.includes('medical')) {
    suggestions = [
      { title: "Health Insurance Tips Every Indian Needs", href: "/articles/health-insurance-tips-india" },
      { title: "Ayushman Bharat vs Private Insurance", href: "/articles/ayushman-vs-private-insurance" }
    ];
  } else if (catLower.includes('women') || catLower.includes('girl')) {
    suggestions = [
      { title: "15 Ways to Earn Money Online in India", href: "/articles/earn-money-online-india" },
      { title: "Sukanya Samriddhi vs Other Savings", href: "/articles/sukanya-samriddhi-guide" }
    ];
  } else if (catLower.includes('student') || catLower.includes('scholar') || catLower.includes('education')) {
    suggestions = [
      { title: "Complete Scholarship Guide for Indian Students", href: "/articles/scholarship-guide-india" },
      { title: "Education Loan Without Collateral", href: "/articles/education-loan-india" }
    ];
  } else {
    suggestions = [
      { title: "PM Schemes That Transfer Money Directly", href: "/articles/pm-schemes-direct-benefit" },
      { title: "15 Ways to Earn Money Online in India", href: "/articles/earn-money-online-india" }
    ];
  }

  return (
    <div className="mt-[40px] bg-[var(--indigo-light)] rounded-[var(--radius-md)] p-[24px]">
      <h3 className="font-[700] text-[16px] text-[var(--text-primary)] mb-[16px]">📖 Helpful Guides Related to This Scheme</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
        {suggestions.map((article, i) => (
          <Link 
            key={i} 
            href={article.href}
            className="bg-white border border-[var(--border)] rounded-[var(--radius-sm)] p-[14px] hover:-translate-y-[2px] transition-transform shadow-sm flex flex-col justify-between h-full"
          >
            <div className="text-[13px] font-[600] text-[var(--text-primary)] mb-[8px] leading-[1.4] line-clamp-2">
              {article.title}
            </div>
            <div className="text-[var(--indigo)] text-[12px] font-[700] mt-auto">
              Read Guide →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
