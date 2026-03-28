require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const SITE = process.env.SITE_URL || 'https://schemeatlas.vercel.app';

const SUBREDDITS = {
  IN: ['india', 'IndiaSpeaks', 'LegalAdviceIndia'],
  GB: ['unitedkingdom', 'UKPersonalFinance', 'DWPhelp'],
  US: ['povertyfinance', 'Assistance', 'Medicaid'],
  NG: ['Nigeria', 'lagos'],
  KE: ['Kenya', 'nairobi'],
};

async function postTelegram(scheme) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) return console.log('Telegram: not configured');

  const msg = `🆕 *NEW SCHEME*\n\n*${scheme.name}*\n🌍 ${scheme.country_name}\n💰 ${scheme.benefit_amount}\n\n${scheme.what_you_get}\n\n👉 Check eligibility: ${SITE}/schemes/${scheme.slug}\n\n#GovernmentScheme #${scheme.country_code}`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: channelId, text: msg, parse_mode: 'Markdown', disable_web_page_preview: false,
    });
    console.log(`✅ Telegram: ${scheme.name}`);
  } catch (e) { console.error('Telegram failed:', e.response?.data?.description || e.message); }
}

async function postReddit(scheme) {
  const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;
  if (!REDDIT_CLIENT_ID) return console.log('Reddit: not configured');

  try {
    const tokenRes = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({ grant_type: 'password', username: REDDIT_USERNAME, password: REDDIT_PASSWORD }),
      { auth: { username: REDDIT_CLIENT_ID, password: REDDIT_CLIENT_SECRET }, headers: { 'User-Agent': 'SchemeAtlas/1.0' } }
    );
    const token = tokenRes.data.access_token;
    const sub = (SUBREDDITS[scheme.country_code] || ['worldnews'])[0];
    const title = `[${scheme.country_name}] ${scheme.name} — ${scheme.benefit_amount} available for eligible residents`;

    await axios.post('https://oauth.reddit.com/api/submit',
      new URLSearchParams({ sr: sub, kind: 'link', title, url: `${SITE}/schemes/${scheme.slug}`, resubmit: 'true' }),
      { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SchemeAtlas/1.0' } }
    );
    console.log(`✅ Reddit r/${sub}: ${scheme.name}`);
  } catch (e) { console.error('Reddit failed:', e.response?.data || e.message); }
}

async function postLinkedIn(scheme) {
  const { LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_ID } = process.env;
  if (!LINKEDIN_ACCESS_TOKEN) return console.log('LinkedIn: not configured');

  const text = `🚨 ${scheme.country_name}: ${scheme.name}\n\n${scheme.what_you_get}\n\n✅ Benefit: ${scheme.benefit_amount}\n\nMillions miss out on government benefits simply because they don't know they exist.\n\nCheck if YOU qualify → ${SITE}/schemes/${scheme.slug}\n\n#GovernmentBenefits #${scheme.country_code} #SocialWelfare`;

  try {
    await axios.post('https://api.linkedin.com/v2/ugcPosts', {
      author: `urn:li:person:${LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'ARTICLE',
          media: [{ status: 'READY', originalUrl: `${SITE}/schemes/${scheme.slug}`, title: { text: scheme.name } }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }, { headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } });
    console.log(`✅ LinkedIn: ${scheme.name}`);
  } catch (e) { console.error('LinkedIn failed:', e.response?.data || e.message); }
}

async function main() {
  console.log('📱 SchemeAtlas Social Media Agent');

  // Get schemes not yet posted to Telegram
  const { data: posted } = await supabase.from('social_posts').select('scheme_id').eq('platform', 'telegram');
  const postedIds = (posted || []).map(p => p.scheme_id);

  const { data: schemes } = await supabase
    .from('schemes')
    .select('*, countries(name)')
    .eq('is_published', true)
    .order('discovered_at', { ascending: false })
    .limit(10);

  const toPost = (schemes || []).filter(s => !postedIds.includes(s.id));
  console.log(`Schemes to post: ${toPost.length}`);

  for (const s of toPost.slice(0, 5)) {
    const enriched = { ...s, country_name: s.countries?.name || s.country_code };
    console.log(`\nPosting: ${s.name}`);

    await postTelegram(enriched);
    await postReddit(enriched);
    await postLinkedIn(enriched);

    await supabase.from('social_posts').insert([
      { scheme_id: s.id, platform: 'telegram', status: 'posted' },
      { scheme_id: s.id, platform: 'reddit', status: 'posted' },
      { scheme_id: s.id, platform: 'linkedin', status: 'posted' },
    ]);

    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('\n✅ Social agent done.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
