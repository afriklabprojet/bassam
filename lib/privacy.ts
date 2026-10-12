export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '[redacted-phone]';
  return `***${digits.slice(-4)}`;
}
