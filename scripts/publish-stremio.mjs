/**
 * Publishes the addon to the Stremio community catalog (same endpoint used by
 * `publishToCentral` from the official stremio-addon-sdk).
 *
 * Usage: npm run publish:stremio -- https://your-addon.vercel.app/manifest.json
 *
 * Requirements: the URL must be public, HTTPS, and return a valid manifest.
 */
const manifestUrl = process.argv[2];

if (!manifestUrl || !/^https:\/\/.+\/manifest\.json$/.test(manifestUrl)) {
  console.error('Usage: npm run publish:stremio -- https://<domain>/manifest.json');
  process.exit(1);
}

// Pre-check: the manifest must be accessible and valid
const check = await fetch(manifestUrl);
if (!check.ok) {
  console.error(`Manifest is not accessible (${check.status}): ${manifestUrl}`);
  process.exit(1);
}
const manifest = await check.json();
for (const field of ['id', 'version', 'name', 'resources', 'types', 'catalogs']) {
  if (!(field in manifest)) {
    console.error(`Manifest is missing required field "${field}"`);
    process.exit(1);
  }
}

const res = await fetch('https://api.strem.io/api/addonPublish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transportUrl: manifestUrl, transportName: 'http' })
});
const body = await res.json().catch(() => ({}));

if (!res.ok || body.error) {
  console.error('Publication error:', body.error || res.status);
  process.exit(1);
}
console.log(`Published ${manifest.name} v${manifest.version}:`, body.result ?? 'ok');
