/** Splits a brand name into a two-line wordmark: everything but the last word, then the last word alone. */
export function splitBrandWordmark(name: string): { primary: string; accent: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { primary: name, accent: '' };
  return { primary: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}
