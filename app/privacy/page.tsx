import { Navbar } from '@/components/Navbar';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container py-16 text-slate-800 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none text-slate-600">
          <p><strong>Last Updated:</strong> April 2025</p>
          
          <h3>1. Information We Collect</h3>
          <p>
            At SchemeAtlas, the privacy of our visitors is of extreme importance to us. We collect anonymous data regarding which schemes are viewed to improve our trending features. We also collect non-personally identifiable information voluntarily provided in our Eligibility Check wizard (such as basic income brackets, age range, and general location/state). 
            <strong> We DO NOT collect sensitive personal data such as full names (unless volunteering via contact forms), social security numbers, or banking details.</strong>
          </p>
          <p>
            <strong>We never sell your data.</strong> Your personal information is never shared with, sold to, or rented to any third party for marketing purposes.
          </p>

          <h3>2. Log Files &amp; Cookies</h3>
          <p>
            Like many other Web sites, we use log files and cookies for analytics purposes only. 
            These simply log visitors to the site — a standard procedure for hosting companies and a part of hosting services' analytics. The information includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamp, and referring/exit pages.
          </p>

          <h3>3. Google AdSense &amp; Third Party Advertising</h3>
          <p>
            Google, as a third party vendor, uses cookies to serve ads on SchemeAtlas. Google's use of the advertising DART cookie enables it to serve ads based on users' visit to our site and other sites on the Internet. Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline">policies.google.com/technologies/ads</a>.
          </p>

          <h3>4. Local Storage (Bookmarks)</h3>
          <p>
            Our "Saved Schemes" functionality relies entirely on your browser's local storage. This data never leaves your device and is not synchronized to our servers unless you explicitly sign up for a cloud account.
          </p>

          <h3>5. User Accounts</h3>
          <p>
            If you create an account on SchemeAtlas, we store your name, email/phone for login purposes only. This data is stored securely on Supabase (our database provider) and is never shared with third parties.
          </p>

          <h3>6. Contact</h3>
          <p>
            If you have questions about this privacy policy, please contact us at: <a href="mailto:contact@schemeatlas.com" className="text-brand-500 underline">contact@schemeatlas.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
