import { Navbar } from '@/components/Navbar';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container py-16 text-slate-800 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Disclaimer</h1>
        <div className="prose prose-slate max-w-none text-slate-600">
          <h3>1. Not a Government Website</h3>
          <p>
            SchemeAtlas is a privately owned and operated information portal. <strong>We are NOT affiliated with, endorsed by, authorized by, or associated in any way with any government entity, agency, department, or administrative body.</strong> 
          </p>

          <h3>2. Information Accuracy</h3>
          <p>
            All information regarding government schemes, eligibility criteria, and benefit amounts is sourced from public domains, RSS feeds, and official pronouncements (e.g. Press Information Bureau). While we use Artificial Intelligence to parse this data and strive for accuracy, policy rules change rapidly. We make no warranties, explicit or implied, about the completeness or reliability of the information found here. 
            You should <strong>always verify</strong> details on the official government portals linked in our "How to Apply" sections.
          </p>

          <h3>3. Educational Purposes Only</h3>
          <p>
            Our eligibility checker is a simulation tool built for educational purposes. A positive result on our platform does not guarantee that your formal application will be approved by the governing authorities.
          </p>

          <h3>4. Scam Warning</h3>
          <p>
            SchemeAtlas will <strong>never ask you for money</strong> to process an application or guarantee you a subsidy. Official programs are generally free to apply for. If someone contacts you claiming to represent SchemeAtlas and demands a fee, it is a scam.
          </p>
        </div>
      </div>
    </div>
  );
}
