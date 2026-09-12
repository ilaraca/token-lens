export const DEFAULT_READABILITY_THRESHOLD = 500;

export function countAlphanumeric(text: string): number {
  const matches = text.match(/[\p{L}\p{N}]/gu);
  return matches?.length ?? 0;
}

export function isLegibleDocument(
  text: string,
  threshold: number = DEFAULT_READABILITY_THRESHOLD,
): boolean {
  return countAlphanumeric(text) >= threshold;
}
