import { Navbar } from '@/components/Navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | SchemeAtlas Non-Governmental Platform',
  description: 'Read the official SchemeAtlas disclaimer. We provide independent information based on public data sources and are not affiliated with any government agency.',
};

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container py-16 text-slate-800 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Disclaimer</h1>
        <div className="prose prose-slate max-w-none text-slate-600">
          <p><strong>Last Updated:</strong> May 2026</p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg my-8 text-amber-900 font-medium">
            <h3 className="text-amber-900 mt-0">Important Notice</h3>
            SchemeAtlas is a privately owned, independent information portal. <strong>We are NOT a government website. We are NOT affiliated with, endorsed by, authorized by, sponsored by, or associated in any way with the Government of India, any State Government, or any government entity, agency, department, or administrative body.</strong>
          </div>

          <h3>1. Nature of the Service</h3>
          <p>
            SchemeAtlas (https://schemeatlas.com) is an educational and informational platform designed to help users discover publicly available government schemes and welfare programs. All data, logos, and program details mentioned on this website belong to their respective government bodies. We simply aggregate this information into a user-friendly format.
          </p>

          <h3>2. Information Accuracy and Reliability</h3>
          <p>
            All information regarding government schemes, eligibility criteria, application processes, and benefit amounts is sourced from public domains, RSS feeds, official government portals, and public press releases. While we strive for accuracy and use advanced technology to parse this data, government policies and scheme rules change rapidly and frequently. 
          </p>
          <p>
            SchemeAtlas makes no warranties, explicit or implied, about the completeness, reliability, suitability, or accuracy of the information found on this website. Any action you take upon the information you find on this website (SchemeAtlas), is strictly at your own risk. SchemeAtlas will not be liable for any losses and/or damages in connection with the use of our website.
          </p>
          <p>
            You should <strong>always verify</strong> details on the official government portals linked in our "How to Apply" sections before making any financial or personal decisions.
          </p>

          <h3>3. Not Financial or Legal Advice</h3>
          <p>
            The content on SchemeAtlas is for informational purposes only. It does not constitute financial, legal, tax, or professional advice. Our AI-powered eligibility checker is a simulation tool built for educational purposes. A positive result on our platform does not guarantee that your formal application will be approved by the governing authorities, nor does it guarantee any financial payout.
          </p>

          <h3>4. Fair Use and Trademarks</h3>
          <p>
            Any logos, trademarks, service marks, or other intellectual property related to government programs displayed on this site are the property of their respective owners. They are used here under the doctrine of "Fair Use" solely for educational and informational purposes to help users identify the correct programs. SchemeAtlas claims no ownership over these government trademarks.
          </p>

          <h3>5. External Links</h3>
          <p>
            From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to provide only quality links to useful and ethical websites (specifically official government application portals), we have no control over the content and nature of these sites. These links to other websites do not imply a recommendation for all the content found on these sites. Site owners and content may change without notice and may occur before we have the opportunity to remove a link which may have gone 'bad'.
          </p>
          <p>
            Please be also aware that when you leave our website, other sites may have different privacy policies and terms which are beyond our control. Please be sure to check the Privacy Policies of these sites as well as their "Terms of Service" before engaging in any business or uploading any information.
          </p>

          <h3>6. Scam Warning</h3>
          <p>
            SchemeAtlas will <strong>never ask you for money</strong> to process a government application, approve a subsidy, or grant you a scheme. Official government welfare programs are generally free to apply for through the official government portals. If someone contacts you claiming to represent SchemeAtlas and demands a fee, it is a fraudulent scam. Please report it immediately.
          </p>

          <h3>7. Consent</h3>
          <p>
            By using our website, you hereby consent to our disclaimer and agree to its terms.
          </p>

          <h3>8. Contact Us</h3>
          <p>
            If you have questions about this disclaimer, or if you believe any information on our site requires correction, please contact us at: <a href="mailto:contact@schemeatlas.com" className="text-brand-500 underline">contact@schemeatlas.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
