import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Required for Cloudflare Pages Edge Runtime


export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
  );

  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

    // Get user profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (pErr || !profile) {
      console.log(`🕒 Profile for session ${session_id} not found yet. Retrying...`);
      return NextResponse.json({ 
        status: 'processing', 
        message: 'Profile sync in progress, please wait...' 
      }, { status: 202 });
    }

    // Check cached results first
    const { data: cached } = await supabaseAdmin
      .from('eligibility_results')
      .select('*')
      .eq('profile_id', profile.id);

    // Get all schemes for this country
    const { data: schemes } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('country_code', profile.country_code)
      .eq('is_published', true);

    if (!schemes || schemes.length === 0) {
      return NextResponse.json({ results: [], profile, message: 'No schemes found for this country yet' });
    }

    // Return cached if available
    if (cached && cached.length > 0) {
      const enriched = cached.map((r: any) => {
        const scheme = schemes.find(s => s.id === r.scheme_id);
        return {
          ...r,
          scheme_name: scheme?.name || '',
          scheme_slug: scheme?.slug || '',
          category: scheme?.category || '',
          benefit_amount: scheme?.benefit_amount || '',
          official_url: scheme?.official_url || '',
          image_keyword: scheme?.image_keyword || '',
          what_you_get: scheme?.what_you_get || '',
        };
      });
      enriched.sort((a: any, b: any) => {
        if (a.is_eligible && !b.is_eligible) return -1;
        if (!a.is_eligible && b.is_eligible) return 1;
        return 0;
      });
      return NextResponse.json({ results: enriched, profile });
    }

    // Call Gemini for each scheme
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });

    const currencyMap: Record<string, string> = { IN: 'INR', GB: 'GBP', US: 'USD', NG: 'NGN', KE: 'KES' };
    const currency = currencyMap[profile.country_code] || 'USD';

    const results: any[] = [];

    for (const scheme of schemes) {
      const prompt = `You are a government scheme eligibility expert. Be helpful — if someone might qualify, say eligible with medium confidence.

User Profile:
- Country: ${profile.country_code}
- Age: ${profile.age} years
- Gender: ${profile.gender}
- Profession: ${profile.profession}
- Annual Income: ${profile.annual_income} ${currency}
- Family Size: ${profile.family_size} members
- State/Region: ${profile.state_region || 'Not specified'}

Scheme to Check:
- Name: ${scheme.name}
- Category: ${scheme.category}
- Eligibility Rules: ${JSON.stringify(scheme.eligibility)}
- Benefit: ${scheme.benefit_amount}
- What they get: ${scheme.what_you_get}

Return ONLY valid JSON, no other text:
{
  "is_eligible": true,
  "confidence": "high",
  "reason": "Simple one-sentence explanation why they qualify or don't qualify",
  "benefit_amount_personal": "Exact benefit this specific person would get",
  "next_step": "The single most important action they should take right now to apply",
  "priority": "high"
}`;

      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
            }),
          }
        );

        const gemData = await gemRes.json();
        const rawText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const clean = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        // Save result to DB
        await supabaseAdmin.from('eligibility_results').insert({
          profile_id: profile.id,
          scheme_id: scheme.id,
          is_eligible: parsed.is_eligible ?? false,
          confidence: parsed.confidence ?? 'low',
          reason: parsed.reason ?? '',
          benefit_amount: parsed.benefit_amount_personal ?? scheme.benefit_amount,
          next_step: parsed.next_step ?? '',
        });

        results.push({
          scheme_id: scheme.id,
          scheme_name: scheme.name,
          scheme_slug: scheme.slug,
          category: scheme.category,
          benefit_amount: scheme.benefit_amount,
          what_you_get: scheme.what_you_get,
          official_url: scheme.official_url,
          image_keyword: scheme.image_keyword,
          is_eligible: parsed.is_eligible ?? false,
          confidence: parsed.confidence ?? 'low',
          reason: parsed.reason ?? '',
          benefit_amount_personal: parsed.benefit_amount_personal ?? scheme.benefit_amount,
          next_step: parsed.next_step ?? '',
          priority: parsed.priority ?? 'low',
        });

        await new Promise(r => setTimeout(r, 400));

      } catch (e) {
        results.push({
          scheme_id: scheme.id,
          scheme_name: scheme.name,
          scheme_slug: scheme.slug,
          category: scheme.category,
          benefit_amount: scheme.benefit_amount,
          what_you_get: scheme.what_you_get,
          official_url: scheme.official_url,
          image_keyword: scheme.image_keyword,
          is_eligible: false,
          confidence: 'low',
          reason: 'Could not check eligibility. Visit official site to confirm.',
          benefit_amount_personal: scheme.benefit_amount,
          next_step: 'Visit official website',
          priority: 'low',
        });
      }
    }

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => {
      if (a.is_eligible && !b.is_eligible) return -1;
      if (!a.is_eligible && b.is_eligible) return 1;
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });

    return NextResponse.json({ results, profile });

  } catch (err: any) {
    console.error('Eligibility API error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
