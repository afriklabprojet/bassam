export const GOLD = 'var(--gold)';
export const GOLD_DEEP = 'var(--gold-deep)';
export const CARD_BG = 'rgba(255,255,255,0.04)';

/**
 * Translucent tint of a CSS color via color-mix(). Replaces the old
 * `${hexColor}NN` alpha-suffix hack, which only worked when the color was a
 * literal hex string — it silently breaks once the color becomes a CSS
 * variable like `var(--gold)`.
 */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
