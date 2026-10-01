/** Builds a "From" header value for transactional emails sent via Resend. */
export function buildFromAddress(localPart: string, brandName: string): string {
  return `${brandName} <${localPart}@vipparfumeriebar.com>`;
}
