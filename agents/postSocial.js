// ============================================
// CLAIMIT — SOCIAL MEDIA AGENT
// agents/postSocial.js
// Posts new schemes to Reddit, Telegram, LinkedIn
// ============================================

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SITE_URL = process.env.SITE_URL || 'https://schemeatlas.vercel.app';

// ============================================
// REDDIT SUBREDDITS PER COUNTRY
// ============================================
const SUBREDDITS = {
  IN: ['india', 'IndiaSpeaks', 'LegalAdviceIndia'],
  GB: ['unitedkingdom', 'UKPersonalFinance'],
  US: ['povertyfinance', 'Assistance'],
  NG: ['Nigeria'],
  KE: ['Kenya']
};

// ============================================
// TELEGRAM POSTER
// Free, unlimited, best for India
// ============================================
async function postTelegram(scheme) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.log('Telegram not configured, skipping');
    return;
  }

  const schemeUrl = `${SITE_URL}/schemes/${scheme.slug}`;

  const message = `
🆕 *NEW SCHEME ALERT*

*${scheme.name}*
🌍 Country: ${scheme.country_name}
💰 Benefit: ${scheme.benefit_amount}
📁 Category: ${scheme.category}

${scheme.what_you_get}

👉 Check if YOU qualify: ${schemeUrl}

#GovernmentScheme #${scheme.country_code} #FreeBenefits
`.trim();

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: channelId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      }
    );

    console.log(`✅ Telegram posted: ${scheme.name}`);
    return response.data.result?.message_id;
  } catch (err) {
    console.error('Telegram post failed:', err.response?.data || err.message);
    return null;
  }
}

// ============================================
// REDDIT POSTER
// Free API, targeted subreddits
// ============================================
async function postReddit(scheme) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret) {
    console.log('Reddit not configured, skipping');
    return;
  }

  try {
    // Get Reddit access token
    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'password',
        username,
        password
      }),
      {
        auth: { username: clientId, password: clientSecret },
        headers: { 'User-Agent': 'SchemeAtlas/1.0' }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const schemeUrl = `${SITE_URL}/schemes/${scheme.slug}`;
    const subreddits = SUBREDDITS[scheme.country_code] || ['worldnews'];

    // Post to first relevant subreddit only (avoid spam)
    const subreddit = subreddits[0];
    const title = `[${scheme.country_name}] ${scheme.name} — ${scheme.benefit_amount} available for eligible residents`;

    const postResponse = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: subreddit,
        kind: 'link',
        title,
        url: schemeUrl,
        resubmit: true
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'SchemeAtlas/1.0'
        }
      }
    );

    const postUrl = postResponse.data?.json?.data?.url;
    console.log(`✅ Reddit posted to r/${subreddit}: ${scheme.name}`);
    return postUrl;
  } catch (err) {
    console.error('Reddit post failed:', err.response?.data || err.message);
    return null;
  }
}

// ============================================
// LINKEDIN POSTER
// Professional audience, global reach
// ============================================
async function postLinkedIn(scheme) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken || !personId) {
    console.log('LinkedIn not configured, skipping');
    return;
  }

  const schemeUrl = `${SITE_URL}/schemes/${scheme.slug}`;

  const postText = `🚨 ${scheme.country_name}: ${scheme.name}

${scheme.what_you_get}

✅ Who qualifies: Check the link
💰 Benefit: ${scheme.benefit_amount}

Millions of eligible people miss out on government benefits simply because they don't know they exist.

Check if YOU qualify → ${schemeUrl}

#GovernmentBenefits #${scheme.country_code} #SocialWelfare #PublicPolicy`;

  try {
    await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: schemeUrl,
              title: { text: scheme.name },
              description: { text: `${scheme.benefit_amount} available` }
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ LinkedIn posted: ${scheme.name}`);
  } catch (err) {
    console.error('LinkedIn post failed:', err.response?.data || err.message);
  }
}

// ============================================
// LOG SOCIAL POST TO SUPABASE
// ============================================
async function logSocialPost(schemeId, platform, postUrl) {
  await supabase.from('social_posts').insert({
    scheme_id: schemeId,
    platform,
    post_url: postUrl,
    status: postUrl ? 'posted' : 'failed'
  });
}

// ============================================
// MAIN SOCIAL AGENT
// Posts all unpublished-to-social schemes
// ============================================
async function runSocialAgent() {
  console.log('📱 SchemeAtlas Social Media Agent Starting...');

  // Get recently added schemes not yet posted to social
  const { data: schemes } = await supabase
    .from('schemes')
    .select(`
      *,
      countries(name)
    `)
    .eq('is_published', true)
    .not('id', 'in', `(
      select scheme_id from social_posts 
      where platform = 'telegram'
    )`)
    .order('discovered_at', { ascending: false })
    .limit(5);

  if (!schemes || schemes.length === 0) {
    console.log('No new schemes to post');
    return;
  }

  for (const scheme of schemes) {
    const enriched = {
      ...scheme,
      country_name: scheme.countries?.name || scheme.country_code
    };

    console.log(`\nPosting: ${scheme.name}`);

    // Post to Telegram
    const telegramId = await postTelegram(enriched);
    await logSocialPost(scheme.id, 'telegram', telegramId);

    // Post to Reddit
    const redditUrl = await postReddit(enriched);
    await logSocialPost(scheme.id, 'reddit', redditUrl);

    // Post to LinkedIn
    await postLinkedIn(enriched);
    await logSocialPost(scheme.id, 'linkedin', null);

    // Wait between posts
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n✅ Social Agent Complete');
}

// Run if called directly
if (require.main === module) {
  runSocialAgent()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Social agent failed:', err);
      process.exit(1);
    });
}

module.exports = { runSocialAgent };
