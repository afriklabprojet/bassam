const XOF_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const CFA_FORMATTER = new Intl.NumberFormat('fr-FR');

/** Format a number as XOF currency: "25 000 FCFA" */
export function formatPrice(amount: number): string {
  return XOF_FORMATTER.format(amount);
}

/** Format a number with space thousands separator and " F" suffix, used in admin */
export function formatCFA(amount: number): string {
  return CFA_FORMATTER.format(amount) + ' F';
}
