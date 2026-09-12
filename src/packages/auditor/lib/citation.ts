export function normalizeForCitation(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function isVerifiedCitation(
  citation: string,
  documentText: string,
): boolean {
  if (!citation) {
    return false;
  }
  const haystack = normalizeForCitation(documentText);
  const needle = normalizeForCitation(citation);
  return needle.length > 0 && haystack.includes(needle);
}
