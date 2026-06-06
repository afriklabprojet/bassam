const XOF_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const CFA_FORMATTER = new Intl.NumberFormat('fr-FR');

const DATE_SHORT_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_DATETIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Format a number as XOF currency: "25 000 FCFA" */
export function formatPrice(amount: number): string {
  return XOF_FORMATTER.format(amount);
}

/** Format a number with space thousands separator and " F" suffix, used in admin */
export function formatCFA(amount: number): string {
  return CFA_FORMATTER.format(amount) + ' F';
}

/** Format an ISO date string as a short date: "12 juin 2025" */
export function formatDateShort(iso: string): string {
  return DATE_SHORT_FORMATTER.format(new Date(iso));
}

/** Format an ISO date string as date + time: "12 juin 2025 14:30" */
export function formatDateTime(iso: string): string {
  return DATE_DATETIME_FORMATTER.format(new Date(iso));
}
