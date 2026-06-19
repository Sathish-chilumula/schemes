interface Section { heading: string; body: string; }

export function parseSchemeContent(raw: string): Section[] {
  if (!raw) return [];

  const LABELS = [
    'title', 'summary', 'what is the scheme', 'key benefits',
    'eligibility criteria', 'who should apply', 'who should not apply',
    'documents required', 'required documents', 'selection',
    'approval process', 'how to apply', 'important dates',
    'official website', 'application', 'pro tips', 'insights', 'faqs',
    'frequently asked questions', 'शीर्षक', 'सारांश', 'శీర్షిక', 'సారాంశం'
  ];

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

  // Filter out: empty sections, "title" heading, "official website" with no real body
  return sections.filter(s => {
    if (s.body.trim().length < 15) return false;
    const h = s.heading.toLowerCase();
    if (h === 'title' || h === 'शीर्षक' || h === 'శీర్షిక') return false;
    return true;
  });
}
