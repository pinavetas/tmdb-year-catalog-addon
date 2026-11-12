/**
 * Hides the user configuration segment (`/<base64 config>/manifest.json|catalog/...|configure`)
 * in log lines: it contains the user's TMDB/RPDB keys, which must never end up in logs.
 */
export function redactConfigSegment(text: string): string {
  return text.replace(/\/[A-Za-z0-9_-]{20,}(?=\/(?:manifest\.json|catalog\/|configure))/g, '/<config>');
}
