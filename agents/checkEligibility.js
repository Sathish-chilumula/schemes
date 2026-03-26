// ============================================
// CLAIMIT — ELIGIBILITY MATCHER
// agents/checkEligibility.js
// Called from API when user submits profile
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ============================================
// CHECK ELIGIBILITY FOR ONE SCHEME
// ============================================
async function checkOneScheme(userProfile, scheme) {
  const prompt = `
You are a government scheme eligibility expert.
Be helpful — if someone MIGHT qualify, say eligible with medium confidence.

User Profile:
- Country: ${userProfile.country_code}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Profession: ${userProfile.profession}
- Annual Income: ${userProfile.annual_income} ${userProfile.currency}
- State/Region: ${userProfile.state_region}
- Family Size: ${userProfile.family_size}

Scheme: ${scheme.name}
Category: ${scheme.category}
Eligibility Rules: ${JSON.stringify(scheme.eligibility)}
Benefit: ${scheme.benefit_amount}

Return ONLY valid JSON:
{
  "is_eligible": true or false,
  "confidence": "high or medium or low",
  "reason": "One simple sentence explaining why they qualify or don't (in plain language, no jargon)",
  "benefit_amount": "Exact benefit this specific person would get",
  "next_step": "The single most important first action they should take right now",
  "priority": "high or medium or low (how urgently they should apply)"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Eligibility check failed:', err.message);
    return {
      is_eligible: false,
      confidence: 'low',
      reason: 'Could not check eligibility',
      benefit_amount: scheme.benefit_amount,
      next_step: 'Visit official website to check',
      priority: 'low'
    };
  }
}

// ============================================
// CHECK ALL SCHEMES FOR A USER PROFILE
// ============================================
async function checkAllSchemes(userProfile, schemes) {
  const results = [];

  for (const scheme of schemes) {
    const result = await checkOneScheme(userProfile, scheme);
    results.push({
      scheme_id: scheme.id,
      scheme_name: scheme.name,
      scheme_slug: scheme.slug,
      category: scheme.category,
      benefit_amount: scheme.benefit_amount,
      image_keyword: scheme.image_keyword,
      official_url: scheme.official_url,
      ...result
    });

    // Small delay between Gemini calls
    await new Promise(r => setTimeout(r, 500));
  }

  // Sort: eligible first, then by priority
  return results.sort((a, b) => {
    if (a.is_eligible && !b.is_eligible) return -1;
    if (!a.is_eligible && b.is_eligible) return 1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

module.exports = { checkOneScheme, checkAllSchemes };
