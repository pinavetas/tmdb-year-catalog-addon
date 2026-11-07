/**
 * Publica el addon en el catálogo comunitario de Stremio (mismo endpoint que usa
 * `publishToCentral` del stremio-addon-sdk oficial).
 *
 * Uso: npm run publish:stremio -- https://tu-addon.vercel.app/manifest.json
 *
 * Requisitos: la URL debe ser pública, HTTPS y devolver un manifiesto válido.
 */
const manifestUrl = process.argv[2];

if (!manifestUrl || !/^https:\/\/.+\/manifest\.json$/.test(manifestUrl)) {
  console.error('Uso: npm run publish:stremio -- https://<dominio>/manifest.json');
  process.exit(1);
}

// Comprobación previa: el manifiesto debe ser accesible y válido
const check = await fetch(manifestUrl);
if (!check.ok) {
  console.error(`El manifiesto no es accesible (${check.status}): ${manifestUrl}`);
  process.exit(1);
}
const manifest = await check.json();
for (const field of ['id', 'version', 'name', 'resources', 'types', 'catalogs']) {
  if (!(field in manifest)) {
    console.error(`El manifiesto no incluye el campo obligatorio "${field}"`);
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
  console.error('Error al publicar:', body.error || res.status);
  process.exit(1);
}
console.log(`Publicado ${manifest.name} v${manifest.version}:`, body.result ?? 'ok');
