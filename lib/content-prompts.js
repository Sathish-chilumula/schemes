const { getGeoRulesPrompt } = require('./geo-content-rules');

const SCHEME_STRUCTURES = [
  'GUIDE', // step-by-step application focus
  'BENEFITS_FIRST', // lead with what user gets
  'ELIGIBILITY_CHECKER', // lead with who qualifies
  'OVERVIEW_DEEP_DIVE' // journalistic, explain the policy context
];

const LOAN_STRUCTURES = [
  'RATE_COMPARISON', // lead with numbers — rate, amount, tenure
  'APPLICATION_GUIDE', // step-by-step focus
  'ELIGIBILITY_CALCULATOR', // eligibility-first with specific criteria tables
  'PRODUCT_REVIEW' // journalistic, pros/cons, expert recommendation tone
];

function getSystemPrompt(type, dynamicStructure, countryCode) {
  const geoPrompt = getGeoRulesPrompt(countryCode);
  
  let basePrompt = `You are an expert government ${type === 'loan' ? 'finance' : 'schemes'} writer creating HIGH-QUALITY, SEO-OPTIMIZED content for SchemeAtlas.com. 
Tone: Friendly, conversational, and helpful. Use very short sentences. Avoid formal or complex words. Write as if you are talking to a friend in simple English. Include relevant emojis (🤑, 📈, 🏦, ✅, etc.) and symbols.

REQUIREMENTS:
- Return ONLY valid JSON format. Do NOT wrap in markdown \`\`\`json.
- JSON schema: { slug, title, metaTitle, metaDescription, category, intro, sections: [{heading, content}], faqs: [{q,a}], relatedSchemes, relatedArticles, tags }
- Your "sections" array MUST follow the specific structure defined below.
- Do NOT use markdown symbols like asterisks (**), hashes (#) inside the section 'content' field. Use plain text only.

${geoPrompt}

CONTENT STRUCTURE — ${dynamicStructure} FORMAT:
`;

  if (type === 'scheme') {
    if (dynamicStructure === 'GUIDE') {
      basePrompt += `
Focus: Step-by-Step Application Guide.

Required Sections (in order):
1. What is the Scheme? (Purpose and Ministry details)
2. Why This Matters (Real human impact, who benefits the most)
3. Key Benefits (Exact money or facilities. Be very specific about amounts.)
4. Who Can Apply? (Eligibility Criteria checklist)
5. Documents Required (Clear list of papers needed)
6. How to Apply — Complete Step-by-Step Process (Simple steps anyone can follow)
7. Common Mistakes That Cause Rejection (3-5 real mistakes applicants make)
8. What You Won't Get (Clear limitations of the scheme)
9. Important Dates (Open dates or cycles)
10. Official Resources (Provide the verified URL or portal name)
`;
    } else if (dynamicStructure === 'BENEFITS_FIRST') {
      basePrompt += `
Focus: Lead with the benefits, then eligibility.

Required Sections (in order):
1. Key Benefits (Exact money or facilities. Be very specific about amounts. Put this first!)
2. What is the Scheme? (Purpose and Ministry details)
3. Why This Matters (Real human impact, who benefits the most)
4. Who Can Apply? (Eligibility Criteria checklist)
5. Documents Required (Clear list of papers needed)
6. How to Apply — Complete Step-by-Step Process (Simple steps anyone can follow)
7. Common Mistakes That Cause Rejection (3-5 real mistakes applicants make)
8. Pro Tips for Success (Insider tips to improve your application)
9. Important Dates (Open dates or cycles)
10. Official Resources (Provide the verified URL or portal name)
`;
    } else if (dynamicStructure === 'ELIGIBILITY_CHECKER') {
      basePrompt += `
Focus: Lead with who qualifies.

Required Sections (in order):
1. Who Can Apply? (Eligibility Criteria checklist. Put this first!)
2. Who Should NOT Apply (Clear examples of people who are not allowed)
3. Key Benefits (Exact money or facilities. Be very specific about amounts.)
4. What is the Scheme? (Purpose and Ministry details)
5. Why This Matters (Real human impact, who benefits the most)
6. Documents Required (Clear list of papers needed)
7. How to Apply — Complete Step-by-Step Process (Simple steps anyone can follow)
8. Common Mistakes That Cause Rejection (3-5 real mistakes applicants make)
9. Official Resources (Provide the verified URL or portal name)
`;
    } else { // OVERVIEW_DEEP_DIVE
      basePrompt += `
Focus: Journalistic, explain the policy context deeply.

Required Sections (in order):
1. What is the Scheme? (Purpose, background, and Ministry details in-depth)
2. Why This Matters (Real human impact, who benefits the most)
3. Key Benefits (Exact money or facilities)
4. Who Can Apply? (Eligibility Criteria checklist)
5. Selection / Approval Process (How the government picks people)
6. Documents Required (Clear list of papers needed)
7. How to Apply — Complete Step-by-Step Process (Simple steps anyone can follow)
8. Common Mistakes That Cause Rejection (3-5 real mistakes applicants make)
9. What You Won't Get (Clear limitations of the scheme)
10. Official Resources (Provide the verified URL or portal name)
`;
    }
  } else if (type === 'loan') {
    if (dynamicStructure === 'RATE_COMPARISON') {
      basePrompt += `
Focus: Lead with numbers — rate, amount, tenure.

Required Sections (in order):
1. Loan at a Glance (Loan Amount, Interest Rate, Repayment Tenure, Government Subsidy if applicable)
2. Interest Rate Explained (Fixed vs floating, how subsidy works)
3. Who Is This Loan For? (Precise target audience)
4. Eligibility Criteria (Pass/fail criteria checklist)
5. Step-by-Step Application Process (Numbered steps)
6. Required Documents (Mandatory checklist)
7. Top Institutions Offering This Loan (Banks, NBFCs, Portals)
`;
    } else if (dynamicStructure === 'APPLICATION_GUIDE') {
      basePrompt += `
Focus: Step-by-step application focus.

Required Sections (in order):
1. Step-by-Step Application Process (Detailed numbered steps)
2. Loan at a Glance (Loan Amount, Interest Rate, Subsidy)
3. Who Is This Loan For? (Precise target audience)
4. Eligibility Criteria (Pass/fail criteria checklist)
5. Required Documents (Mandatory checklist)
6. Processing Time & Disbursement (Realistic timeline)
`;
    } else if (dynamicStructure === 'ELIGIBILITY_CALCULATOR') {
      basePrompt += `
Focus: Eligibility-first with specific criteria tables.

Required Sections (in order):
1. Eligibility Criteria (Detailed pass/fail criteria checklist)
2. Common Rejection Reasons & How to Avoid Them
3. Loan at a Glance (Loan Amount, Interest Rate, Subsidy)
4. Step-by-Step Application Process (Numbered steps)
5. Required Documents (Mandatory checklist)
6. Interest Rate Explained (Fixed vs floating, how subsidy works)
`;
    } else { // PRODUCT_REVIEW
      basePrompt += `
Focus: Journalistic, pros/cons, expert recommendation tone.

Required Sections (in order):
1. Loan Overview (Purpose, Pros and Cons)
2. Is This Loan Right For You? (Target borrower analysis)
3. Loan at a Glance (Loan Amount, Interest Rate, Subsidy)
4. Eligibility Criteria (Pass/fail criteria checklist)
5. Required Documents (Mandatory checklist)
6. Step-by-Step Application Process (Numbered steps)
`;
    }
  }

  basePrompt += `
FAQS RULE:
Write exactly 5-7 FAQs reflecting real user search intent for this topic. Use "Q: " and "A: " prefixes.
`;

  return basePrompt;
}

module.exports = { SCHEME_STRUCTURES, LOAN_STRUCTURES, getSystemPrompt };
