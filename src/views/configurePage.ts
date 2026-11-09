/**
 * Página web de configuración (`/configure` y `/:config/configure`).
 *
 * Se distribuye como módulo TypeScript (y no como fichero .html leído con `fs`) para que se
 * incluya automáticamente en el bundle de Vercel Functions, Docker o cualquier runtime.
 *
 * Al abrirse desde Stremio con un addon ya configurado (`/<config>/configure`), el formulario
 * se rellena con la configuración actual leyendo el segmento Base64 de la URL.
 */
export const CONFIGURE_HTML = /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Configurar Catálogo TMDB (Año, País y Calidad)</title>
  <link rel="icon" type="image/png" href="/logo.png">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d30;
      --field-bg: #0d1322;
      --border: #23314e;
      --accent: #38bdf8;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --success: #10b981;
      --warning: #f59e0b;
    }

    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem 1rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }

    .container {
      width: 100%;
      max-width: 560px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2.25rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 480px) {
      .container { padding: 1.5rem 1.1rem; }
    }

    .header { text-align: center; margin-bottom: 2rem; }
    .header img { width: 72px; height: 72px; border-radius: 16px; margin-bottom: 0.75rem; }

    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    h1 { margin: 0 0 0.5rem 0; font-size: 1.65rem; font-weight: 700; }

    p.subtitle { color: var(--text-muted); margin: 0; font-size: 0.95rem; line-height: 1.5; }

    .section { margin-bottom: 1.75rem; }

    .section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 0.85rem;
      font-weight: 700;
    }

    .info-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-left: 3px solid var(--accent);
      border-radius: 0.65rem;
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .guide-details {
      background: var(--field-bg);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      padding: 0.85rem 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }

    .guide-details summary {
      cursor: pointer;
      color: var(--accent);
      font-weight: 600;
      user-select: none;
    }

    .guide-details summary:hover { text-decoration: underline; }

    .guide-details[open] summary { margin-bottom: 0.85rem; }

    .steps-list {
      margin: 0;
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .steps-list li strong { color: var(--text); }
    .steps-list a { color: var(--accent); text-decoration: underline; }
    .steps-sublist {
      margin: 0.35rem 0 0 0;
      padding-left: 1.25rem;
      font-size: 0.8rem;
    }

    .monospace-input {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.85rem;
    }

    .form-group { margin-bottom: 1.25rem; }

    label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.4rem; }

    .help-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem; line-height: 1.45; }
    .help-text.warning { color: var(--warning); }

    input[type="text"],
    input[type="password"],
    input[type="number"],
    select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--field-bg);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      color: var(--text);
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    select {
      cursor: pointer;
    }

    input:focus-visible,
    select:focus-visible {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
    }

    input[aria-invalid="true"] { border-color: #ef4444; }

    .checkbox-group { display: flex; flex-direction: column; gap: 0.75rem; }

    .checkbox-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--field-bg);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      cursor: pointer;
      user-select: none;
      margin: 0;
      font-weight: 500;
      transition: border-color 0.2s, background 0.2s;
    }

    .checkbox-item:hover { border-color: var(--accent); background: #111a30; }

    .checkbox-item input[type="checkbox"] {
      margin: 0 0.85rem 0 0;
      width: 1.15rem;
      height: 1.15rem;
      flex-shrink: 0;
      accent-color: var(--accent);
      cursor: pointer;
    }

    .actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.95rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      color: var(--text);
      transition: transform 0.1s, background 0.2s, box-shadow 0.2s;
    }

    .btn:active { transform: scale(0.98); }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35);
    }
    .btn-primary:hover { background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); }

    .btn-secondary { background: #1e293b; border: 1px solid var(--border); }
    .btn-secondary:hover { background: #27354f; }

    .btn[aria-disabled="true"] { opacity: 0.5; pointer-events: none; }

    .url-preview {
      margin-top: 0.5rem;
      background: #0a0e18;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      padding: 0.75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.75rem;
      color: var(--accent);
      word-break: break-all;
    }

    .copied-toast {
      visibility: hidden;
      text-align: center;
      color: var(--success);
      font-size: 0.85rem;
      font-weight: 600;
      min-height: 1.2em;
    }

    .footer { margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }
    .footer a { color: var(--text-muted); }
  </style>
</head>
<body>
  <main class="container">
    <div class="header">
      <img src="/logo.png" alt="" width="72" height="72">
      <div><span class="badge">Stremio • Nuvio • Alder</span></div>
      <h1>Catálogo TMDB: Año, País y Calidad</h1>
      <p class="subtitle">Personaliza tus catálogos y umbrales de puntuación antes de instalar el addon en tu reproductor.</p>
    </div>

    <form id="configForm" onsubmit="return false">
      <!-- Sección 1: API Key de TMDB -->
      <div class="section">
        <div class="section-title">1. Clave de TMDB</div>

        <div class="info-card">
          💡 <strong>¿Para qué se usa?</strong> Este addon consulta la base de datos de <em>The Movie Database (TMDB)</em> para filtrar y ordenar películas y series por país, año y valoración de los usuarios de TMDB. Para poder funcionar, <strong>requiere tu clave de API gratuita</strong>.
        </div>

        <details class="guide-details">
          <summary>📋 Cómo obtener tu clave gratis en 2 minutos (paso a paso)</summary>
          <ol class="steps-list">
            <li><strong>Crea tu cuenta:</strong> Regístrate gratis en <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org/signup</a> y confirma tu email.</li>
            <li><strong>Ve a la sección API:</strong> Entra en <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">themoviedb.org/settings/api</a>.</li>
            <li><strong>Crea la clave:</strong> Haz clic en <em>«Crear»</em> (Create) y elige la opción <strong>«Developer»</strong> (Desarrollador).</li>
            <li><strong>Rellena los datos básicos:</strong> Acepta los términos y escribe en el formulario:
              <ul class="steps-sublist">
                <li><em>Nombre de aplicación:</em> Stremio Addon</li>
                <li><em>URL de aplicación:</em> https://stremio.com</li>
                <li><em>Resumen:</em> Addon de catálogos personales para Stremio</li>
              </ul>
            </li>
            <li><strong>Copia la clave:</strong> Copia la <strong>«Clave de API (v3 auth)»</strong> (32 caracteres alfanuméricos) o el <strong>«Token de lectura (v4)»</strong> y pégalo abajo.</li>
          </ol>
        </details>

        <div class="form-group">
          <label for="tmdbKey">Clave API v3 o token v4 de TheMovieDB</label>
          <input type="text" id="tmdbKey" class="monospace-input" autocomplete="off" spellcheck="false"
                 placeholder="Pega aquí tu clave v3 (32 caracteres) o token v4..." required>
          <div class="help-text warning">⚠️ La clave viaja codificada dentro de la URL del addon para que tu reproductor consulte los catálogos. No compartas tu enlace personal si no deseas prestar tu cuota.</div>
        </div>
      </div>

      <!-- Sección 2: Regiones / Países de interés -->
      <div class="section">
        <div class="section-title">2. Regiones de interés</div>
        <div class="help-text" style="margin-bottom: 0.75rem;">
          Marca las procedencias que te interesan. Si no marcas ninguna, se incluirán producciones de todo el mundo.
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="region_europe" checked>
            <span>🇪🇺 Europa (Reino Unido, Francia, España, Italia, Alemania, Nórdicos...)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_spain">
            <span>🇪🇸 España</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_us" checked>
            <span>🇺🇸 Estados Unidos / Hollywood</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_latam" checked>
            <span>🌎 Latinoamérica (Argentina, México, Brasil, Colombia...)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_asia">
            <span>🌏 Asia (Japón, Corea del Sur, Hong Kong, India...)</span>
          </label>
        </div>
      </div>

      <!-- Sección 3: Calidad mínima de TMDB -->
      <div class="section">
        <div class="section-title">3. Nota mínima de corte (TMDB)</div>
        <div class="form-group">
          <label for="minRating">Puntuación mínima en TMDB (0 - 10)</label>
          <select id="minRating">
            <option value="7.0" selected>⭐ TMDB 7.0+ (Notable - Recomendado)</option>
            <option value="7.5">⭐ TMDB 7.5+ (Notable Alto)</option>
            <option value="8.0">⭐ TMDB 8.0+ (Sobresaliente)</option>
            <option value="8.5">⭐ TMDB 8.5+ (Obras Maestras)</option>
            <option value="0">🎬 Sin nota mínima (Cualquier puntuación)</option>
          </select>
          <div class="help-text">Filtra por la valoración media en TMDB. La carátula en Stremio mostrará esta nota (ej. <em>2024 · TMDB 8.2</em>). Ten en cuenta que si tienes otros addons de metadatos (como Cinemeta), estos mostrarán dentro de la ficha la nota de IMDb, que suele diferir de la de TMDB.</div>
        </div>
      </div>

      <!-- Sección 4: Umbral de Votos -->
      <div class="section">
        <div class="section-title">4. Votos mínimos</div>
        <div class="form-group">
          <label for="minVotesMovie">Mínimo de votos para películas</label>
          <input type="number" id="minVotesMovie" inputmode="numeric" placeholder="200" min="1" max="5000" step="1">
          <div class="help-text">Evita que aparezcan títulos desconocidos con pocas valoraciones y notas infladas.</div>
        </div>
        <div class="form-group">
          <label for="minVotesSeries">Mínimo de votos para series</label>
          <input type="number" id="minVotesSeries" inputmode="numeric" placeholder="50" min="1" max="2000" step="1">
        </div>
      </div>

      <!-- Sección 5: Catálogos -->
      <div class="section">
        <div class="section-title">5. Catálogos en Stremio</div>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="enableMovies" checked>
            <span>🎬 Mejores Películas (con selector de Año / Época)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="enableSeries" checked>
            <span>📺 Mejores Series (con selector de Año / Época)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="enableSearch" checked>
            <span>🔎 Búsqueda inteligente en la barra de búsqueda («2023 8+», «dune 2024»)</span>
          </label>
        </div>
      </div>
    </form>

    <!-- Instalación -->
    <div class="actions">
      <a id="installStremioBtn" href="#" class="btn btn-primary">🚀 Instalar en Stremio</a>
      <a id="installWebBtn" href="#" class="btn btn-secondary" target="_blank" rel="noopener">🌐 Instalar en Stremio Web</a>
      <button id="copyUrlBtn" type="button" class="btn btn-secondary">📋 Copiar URL del manifiesto (Nuvio / otros)</button>
      <div id="copiedToast" class="copied-toast" role="status">¡Enlace copiado al portapapeles!</div>
      <div id="urlPreview" class="url-preview"></div>
    </div>

    <p class="footer">
      Este addon solo proporciona catálogos: la reproducción depende de los addons de streams que tengas instalados.<br>
      Datos de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
    </p>
  </main>

  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };
      var REGION_KEYS = ['europe', 'spain', 'us', 'latam', 'asia'];
      var CONTENT_KEYS = ['enableMovies', 'enableSeries', 'enableSearch'];

      function toBase64Url(str) {
        var bytes = new TextEncoder().encode(str);
        var bin = '';
        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
        return btoa(bin).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
      }

      function fromBase64Url(str) {
        var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      }

      // Ruta base del addon: todo lo anterior a /configure, sin el segmento de configuración
      var path = window.location.pathname.replace(/\\/+$/, '');
      var segments = path.split('/').filter(Boolean);
      var existingConfig = segments.length >= 2 && segments[segments.length - 1] === 'configure'
        ? segments[segments.length - 2] : null;
      var basePath = '/' + segments.slice(0, existingConfig ? -2 : -1).join('/');
      if (basePath === '/') basePath = '';
      var origin = window.location.origin + basePath;

      // Rellenar el formulario con la configuración actual (si se abre desde un addon instalado)
      if (existingConfig) {
        try {
          var current = JSON.parse(fromBase64Url(existingConfig));
          if (current && typeof current === 'object') {
            if (typeof current.tmdbApiKey === 'string') $('tmdbKey').value = current.tmdbApiKey;
            if (Array.isArray(current.regions)) {
              REGION_KEYS.forEach(function (k) {
                var el = $('region_' + k);
                if (el) el.checked = current.regions.indexOf(k) !== -1;
              });
            }
            if (current.minRating !== undefined && $('minRating')) {
              $('minRating').value = String(current.minRating);
            }
            if (current.minVotesMovie) $('minVotesMovie').value = String(current.minVotesMovie);
            if (current.minVotesSeries) $('minVotesSeries').value = String(current.minVotesSeries);
            CONTENT_KEYS.forEach(function (id) {
              if (typeof current[id] === 'boolean') $(id).checked = current[id];
            });
          }
        } catch (e) { /* configuración ilegible: se usan los valores por defecto */ }
      }

      var TMDB_KEY_PATTERN = /^[A-Za-z0-9_.-]{16,1024}$/;

      function readInt(id, min, max) {
        var input = $(id);
        var raw = input.value.trim();
        if (!raw) { input.removeAttribute('aria-invalid'); return undefined; }
        var val = parseInt(raw, 10);
        var valid = Number.isFinite(val) && val >= min && val <= max;
        input.setAttribute('aria-invalid', valid ? 'false' : 'true');
        return valid ? val : undefined;
      }

      function generate() {
        var config = {};
        var keyInput = $('tmdbKey');
        var key = keyInput.value.trim();
        var keyValid = false;

        if (key) {
          if (TMDB_KEY_PATTERN.test(key)) {
            config.tmdbApiKey = key;
            keyValid = true;
            keyInput.setAttribute('aria-invalid', 'false');
          } else {
            keyInput.setAttribute('aria-invalid', 'true');
          }
        } else {
          keyInput.removeAttribute('aria-invalid');
        }

        var selectedRegions = [];
        REGION_KEYS.forEach(function (k) {
          var el = $('region_' + k);
          if (el && el.checked) selectedRegions.push(k);
        });
        if (selectedRegions.length > 0) {
          config.regions = selectedRegions;
        }

        var minRatingVal = parseFloat($('minRating').value);
        if (Number.isFinite(minRatingVal)) {
          config.minRating = minRatingVal;
        }

        var mvm = readInt('minVotesMovie', 1, 5000);
        if (mvm !== undefined) config.minVotesMovie = mvm;
        var mvs = readInt('minVotesSeries', 1, 2000);
        if (mvs !== undefined) config.minVotesSeries = mvs;

        CONTENT_KEYS.forEach(function (id) { config[id] = $(id).checked; });

        var catalogsEnabled = config.enableMovies || config.enableSeries;
        var canInstall = keyValid && catalogsEnabled;

        var manifestUrl = origin + '/' + toBase64Url(JSON.stringify(config)) + '/manifest.json';
        var stremioUrl = manifestUrl.replace(/^https?:\\/\\//, 'stremio://');
        var webUrl = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(manifestUrl);

        $('installStremioBtn').href = canInstall ? stremioUrl : '#';
        $('installWebBtn').href = canInstall ? webUrl : '#';
        ['installStremioBtn', 'installWebBtn', 'copyUrlBtn'].forEach(function (id) {
          $(id).setAttribute('aria-disabled', canInstall ? 'false' : 'true');
        });

        if (!key) {
          $('urlPreview').textContent = '⚠️ Introduce tu clave de TMDB para generar el enlace de instalación.';
        } else if (!keyValid) {
          $('urlPreview').textContent = '⚠️ La clave de TMDB no es válida (debe tener al menos 16 caracteres alfanuméricos sin espacios).';
        } else if (!catalogsEnabled) {
          $('urlPreview').textContent = '⚠️ Activa al menos Películas o Series para instalar el addon.';
        } else {
          $('urlPreview').textContent = manifestUrl;
        }

        return canInstall ? manifestUrl : '';
      }

      function handleInstallClick(e) {
        var url = generate();
        if (!url) {
          e.preventDefault();
          e.stopPropagation();
          $('tmdbKey').focus();
          return false;
        }
      }

      $('installStremioBtn').addEventListener('click', handleInstallClick);
      $('installWebBtn').addEventListener('click', handleInstallClick);

      document.querySelectorAll('input, select').forEach(function (el) {
        el.addEventListener('input', generate);
        el.addEventListener('change', generate);
      });

      $('copyUrlBtn').addEventListener('click', function () {
        var url = generate();
        if (!url) return;
        var toast = $('copiedToast');
        var done = function () {
          toast.style.visibility = 'visible';
          setTimeout(function () { toast.style.visibility = 'hidden'; }, 2500);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copia la URL del manifiesto:', url); });
        } else {
          window.prompt('Copia la URL del manifiesto:', url);
        }
      });

      generate();
    })();
  </script>
</body>
</html>
`;
