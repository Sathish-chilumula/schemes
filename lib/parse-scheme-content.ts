interface Section { heading: string; body: string; }

export function parseSchemeContent(raw: string): Section[] {
  if (!raw) return [];

  const LABELS = [
    'title', 'summary', 'what is the scheme', 'key benefits',
    'eligibility criteria', 'who should apply', 'who should not apply',
    'documents required', 'required documents', 'selection',
    'approval process', 'how to apply', 'important dates',
    'official website', 'application', 'pro tips', 'insights', 'faqs',
    'frequently asked questions',
    'pro tips / insights', 'official website / application',
    'what is the scheme?', 'key benefits?',
    // Hindi labels
    'शीर्षक', 'सारांश', 'मुख्य लाभ', 'पात्रता मानदंड', 'आवेदन कैसे करें',
    'आवश्यक दस्तावेज़', 'आधिकारिक वेबसाइट', 'अक्सर पूछे जाने वाले प्रश्न',
    // Telugu labels
    'శీర్షిక', 'సారాంశం', 'ముఖ్య ప్రయోజనాలు', 'అర్హత ప్రమాణాలు',
    'దరఖాస్తు ఎలా చేయాలి', 'అవసరమైన పత్రాలు', 'అధికారిక వెబ్‌సైట్',
  ];

  // Headings that should be HIDDEN entirely (not rendered as section titles)
  const HIDDEN_HEADINGS = new Set([
    'title', 'summary', 'శీర్షిక', 'शीर्षक',
    'pro tips', 'insights', 'pro tips / insights',
    'official website', 'application', 'official website / application',
    'faqs', 'frequently asked questions',
  ]);

  const lines = raw.split(/\n+/);
  const sections: Section[] = [];
  let current: Section = { heading: '', body: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect label pattern: "Label Text:" at start of line
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 60) {
      const potentialLabel = trimmed.substring(0, colonIdx).toLowerCase().trim();
      const isKnownLabel = LABELS.some(l => potentialLabel.includes(l));
      if (isKnownLabel) {
        if (current.body.trim()) sections.push({ ...current });
        current = {
          heading: trimmed.substring(0, colonIdx).trim(),
          body: trimmed.substring(colonIdx + 1).trim(),
        };
        continue;
      }
    }
    // FAQ question pattern
    if (trimmed.match(/^Q\./i) || trimmed.match(/^##\s*Q\./i)) {
      if (current.body.trim()) sections.push({ ...current });
      current = { heading: 'Q', body: trimmed.replace(/^(##\s*)?Q\./i, '').trim() };
      continue;
    }
    current.body += (current.body ? '\n' : '') + trimmed;
  }
  if (current.body.trim()) sections.push({ ...current });

  // Filter out: empty sections, hidden headings, "official website" with no real body
  return sections.filter(s => {
    if (s.body.trim().length < 15) return false;
    const h = s.heading.toLowerCase().trim();
    if (HIDDEN_HEADINGS.has(h)) return false;
    // Also hide any heading that ends with '?' and matches a label
    const hNoQ = h.replace(/\?$/, '').trim();
    if (HIDDEN_HEADINGS.has(hNoQ)) return false;
    return true;
  });
}

