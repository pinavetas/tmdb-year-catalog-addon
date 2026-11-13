/**
 * Removes secrets from log lines:
 * - the user configuration segment (`/<base64 config>/manifest.json|catalog/...|configure`), which
 *   contains the user's TMDB/RPDB keys;
 * - the `key` query parameter (stats endpoint access key).
 */
export function redactConfigSegment(text: string): string {
  return text
    .replace(/\/[A-Za-z0-9_-]{20,}(?=\/(?:manifest\.json|catalog\/|configure))/g, '/<config>')
    .replace(/([?&]key=)[^&\s]+/g, '$1<redacted>');
}
