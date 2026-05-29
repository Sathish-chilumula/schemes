const GEO_CONFIG = {
  IN: {
    currency: '₹',
    currencyFull: 'Indian Rupees',
    terminology: {
      scheme: 'yojana / scheme',
      benefit: 'benefit',
      apply: 'apply online',
      portal: 'official portal',
      ministry: 'Ministry',
      financialProduct: 'loan / financial scheme'
    },
    dateFormat: 'DD/MM/YYYY',
    targetKeywords: ['india', 'state name', 'district', 'central government'],
    seoBoost: ['Apply Online', '2025-26', 'Last Date', 'Status Check']
  },
  US: {
    currency: '$',
    currencyFull: 'US Dollars',
    terminology: {
      scheme: 'program / benefit',
      benefit: 'benefit',
      apply: 'apply',
      portal: 'official website',
      ministry: 'Department',
      financialProduct: 'loan / financial product'
    },
    dateFormat: 'MM/DD/YYYY',
    targetKeywords: ['federal', 'state', 'county', 'USA', 'Americans'],
    seoBoost: ['How to Apply', '2025', 'Eligibility', 'Benefits']
  },
  GB: {
    currency: '£',
    currencyFull: 'British Pounds',
    terminology: {
      scheme: 'scheme / benefit',
      benefit: 'entitlement',
      apply: 'claim / apply',
      portal: 'GOV.UK page',
      ministry: 'Department',
      financialProduct: 'loan / financial scheme'
    },
    dateFormat: 'DD/MM/YYYY',
    targetKeywords: ['UK', 'England', 'Scotland', 'Wales', 'GOV.UK'],
    seoBoost: ['How to Claim', '2025/26', 'Eligibility', 'Universal Credit']
  },
  AU: {
    currency: 'A$',
    currencyFull: 'Australian Dollars',
    terminology: {
      scheme: 'payment / support',
      benefit: 'payment',
      apply: 'apply',
      portal: 'Services Australia',
      ministry: 'Department',
      financialProduct: 'loan / financial product'
    },
    dateFormat: 'DD/MM/YYYY',
    targetKeywords: ['Australia', 'Centrelink', 'state', 'territory'],
    seoBoost: ['Centrelink', '2025', 'Eligibility', 'How to Apply']
  },
  CA: {
    currency: 'CA$',
    currencyFull: 'Canadian Dollars',
    terminology: {
      scheme: 'benefit / program',
      benefit: 'benefit',
      apply: 'apply',
      portal: 'Canada.ca',
      ministry: 'Ministry / Department',
      financialProduct: 'loan / financial product'
    },
    dateFormat: 'MM/DD/YYYY',
    targetKeywords: ['Canada', 'federal', 'provincial', 'CRA'],
    seoBoost: ['CRA', '2025', 'Eligibility', 'Apply Online']
  },
  NG: {
    currency: '₦',
    currencyFull: 'Nigerian Naira',
    terminology: {
      scheme: 'programme / scheme',
      benefit: 'benefit',
      apply: 'apply',
      portal: 'official portal',
      ministry: 'Ministry',
      financialProduct: 'loan / micro-credit'
    },
    dateFormat: 'DD/MM/YYYY',
    targetKeywords: ['Nigeria', 'federal', 'state'],
    seoBoost: ['How to Apply', '2025', 'Eligibility', 'Portal']
  },
  KE: {
    currency: 'KSh',
    currencyFull: 'Kenyan Shillings',
    terminology: {
      scheme: 'fund / programme',
      benefit: 'benefit',
      apply: 'apply',
      portal: 'official portal',
      ministry: 'Ministry',
      financialProduct: 'loan / fund'
    },
    dateFormat: 'DD/MM/YYYY',
    targetKeywords: ['Kenya', 'county', 'national'],
    seoBoost: ['How to Apply', '2025', 'Eligibility', 'Requirements']
  }
};

function getGeoRulesPrompt(countryCode) {
  const geo = GEO_CONFIG[countryCode] || GEO_CONFIG['IN']; // Fallback to IN if unknown

  return `
GEOGRAPHIC LOCALIZATION RULES FOR ${countryCode}:
- Use currency symbol: ${geo.currency} (${geo.currencyFull})
- Use correct terminology: use "${geo.terminology.scheme}" not generic "scheme" where appropriate. For financial products, use "${geo.terminology.financialProduct}".
- Government body naming: use "${geo.terminology.ministry}" format.
- Date format: ${geo.dateFormat}
- SEO keywords to include naturally: ${geo.targetKeywords.join(', ')}
- High-value search phrases to incorporate: ${geo.seoBoost.join(', ')}
- Write as if for a resident of this country who is searching on Google.
- Do NOT use terminology from other countries' systems (e.g., do not use IRS in the UK).
`;
}

module.exports = { GEO_CONFIG, getGeoRulesPrompt };
