/**
 * Serializes JSON-LD for an inline `<script type="application/ld+json">`.
 * `<` is escaped so a value containing `</script>` (a product name, a
 * description) can't close the tag early; JSON parsers read `<` as `<`.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
