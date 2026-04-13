import { supabase } from '@/lib/supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DiagPage() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'Not Set',
    RUNTIME: 'Edge Runtime',
    TIMESTAMP: new Date().toISOString()
  };

  let dbStatus = 'Checking...';
  try {
    const client = supabase; // Use the proxy
    const { error, data } = await client.from('schemes').select('id').limit(1);
    
    if (error) {
      dbStatus = `🔴 Connection Error: ${error.message} (${error.code || 'No Code'})`;
    } else {
      dbStatus = '🟢 Healthy (Successfully connected to Supabase!)';
    }
  } catch (err: any) {
    dbStatus = `💥 Crash during check: ${err.message || 'Unknown Error'}`;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#38bdf8' }}>System Diagnostic v1.1</h1>
      <hr style={{ borderColor: '#334155' }} />
      
      <section style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Environment Variables (Presence)</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(envStatus).map(([key, value]) => (
            <li key={key} style={{ padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#94a3b8' }}>{key}:</span> {' '}
              <span style={{ color: typeof value === 'boolean' ? (value ? '#4ade80' : '#f87171') : '#f472b6' }}>
                {String(value)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: '30px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', marginTop: 0 }}>Database Connectivity</h2>
        <p style={{ fontSize: '1.1rem', color: dbStatus.includes('Healthy') ? '#4ade80' : '#f87171' }}>
          {dbStatus}
        </p>
      </section>

      <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#475569' }}>
        <p>If variables show "false", they are not successfully being injected by Cloudflare's Edge Runtime.</p>
        <p>Ensure they are added to <strong>Settings -> Functions -> Variables</strong> in the Cloudflare Pages Dashboard.</p>
      </div>
    </div>
  );
}
