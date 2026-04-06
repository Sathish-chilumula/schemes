import { Navbar } from '@/components/Navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | SchemeAtlas Global Platform',
  description: 'Read the official terms of service for the SchemeAtlas platform. Learn about your rights and responsibilities when discovering government schemes.',
};

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container py-16 text-slate-800 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Terms and Conditions</h1>
        <div className="prose prose-slate max-w-none text-slate-600">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing the SchemeAtlas portal, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.
          </p>

          <h3>2. Information Not Advice</h3>
          <p>
            The information contained on this website is for general information purposes only. The information is provided by SchemeAtlas and while we endeavour to keep the information up to date and correct, we make no representations or warranties of any kind about the completeness or accuracy with respect to the website.
          </p>

          <h3>3. Modifying the Services</h3>
          <p>
            We reserve the right to modify or terminate the SchemeAtlas service for any reason, without notice, at any time. We reserve the right to alter these Terms of Use at any time.
          </p>

          <h3>4. Contact Information</h3>
          <p>
            If you have any questions or concerns regarding these Terms of Service, please contact us at: <a href="mailto:contact@schemeatlas.com" className="text-brand-500 underline">contact@schemeatlas.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
