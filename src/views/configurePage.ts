/**
 * Página web de configuración (`/configure` y `/:config/configure`).
 * Soporte bilingüe completo (inglés y español).
 */
export const CONFIGURE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title id="docTitle">Configure TMDB Catalog (Year, Country & Rating)</title>
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

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .lang-switch {
      display: inline-flex;
      background: var(--field-bg);
      border: 1px solid var(--border);
      border-radius: 9999px;
      padding: 2px;
      gap: 2px;
    }

    .lang-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lang-btn.active {
      background: var(--accent);
      color: #0b0f19;
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
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 0.65rem;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }

    .guide-details summary {
      cursor: pointer;
      color: var(--accent);
      font-weight: 600;
      user-select: none;
    }

    .guide-details summary:hover {
      text-decoration: underline;
    }

    .steps-list {
      margin: 0.75rem 0 0.25rem 1.25rem;
      padding: 0;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .steps-list li { margin-bottom: 0.4rem; }
    .steps-list a { color: var(--accent); text-decoration: none; }
    .steps-list a:hover { text-decoration: underline; }

    .steps-sublist {
      margin: 0.35rem 0 0.35rem 1.25rem;
      padding: 0;
      list-style-type: disc;
      color: #cbd5e1;
      font-size: 0.8rem;
    }

    .form-group { margin-bottom: 1.15rem; }
    label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.9rem; }

    input[type="text"], input[type="number"], select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--field-bg);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      color: var(--text);
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="text"]:focus, input[type="number"]:focus, select:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }

    .monospace-input { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; }

    .help-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4; }
    .help-text.warning { color: var(--warning); }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: var(--field-bg);
      padding: 1rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border);
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-size: 0.9rem;
      user-select: none;
    }

    .checkbox-item input[type="checkbox"] {
      width: 1.15rem;
      height: 1.15rem;
      accent-color: var(--accent);
      cursor: pointer;
    }

    .actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; }

    .btn {
      display: block;
      width: 100%;
      padding: 0.9rem 1.25rem;
      border-radius: 0.65rem;
      font-weight: 600;
      font-size: 1rem;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.2s, background-color 0.2s;
      border: none;
    }

    .btn:active { transform: scale(0.98); }
    .btn-primary { background: var(--accent); color: #0b0f19; }
    .btn-primary:hover { background: #7dd3fc; }
    .btn-secondary { background: #1e293b; color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: #27354f; }

    .btn[aria-disabled="true"], button[aria-disabled="true"] {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    .url-preview {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #0f172a;
      border-radius: 0.5rem;
      font-family: ui-monospace, Menlo, Consolas, monospace;
      font-size: 0.75rem;
      color: var(--accent);
      word-break: break-all;
      border: 1px dashed var(--border);
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
    <div class="top-bar">
      <span class="badge">Stremio • Nuvio • Alder</span>
      <div class="lang-switch" role="radiogroup" aria-label="Language / Idioma">
        <button type="button" class="lang-btn active" id="btn_en" data-lang="en">🇬🇧 English</button>
        <button type="button" class="lang-btn" id="btn_es" data-lang="es">🇪🇸 Español</button>
      </div>
    </div>

    <div class="header">
      <img src="/logo.png" alt="" width="72" height="72">
      <h1 id="titleText">TMDB Catalog: Year, Country & Rating</h1>
      <p id="subtitleText" class="subtitle">Customize your catalogs, language and rating filters before installing the addon.</p>
    </div>

    <form id="configForm" onsubmit="return false">
      <!-- Section 1: TMDB API Key -->
      <div class="section">
        <div class="section-title" id="sec1_title">1. TMDB API Key</div>

        <div class="info-card" id="sec1_info">
          💡 <strong>What is this for?</strong> This addon queries <em>The Movie Database (TMDB)</em> to filter and sort movies and series by country, year and rating. To work, <strong>it requires your free TMDB API key</strong>.
        </div>

        <details class="guide-details">
          <summary id="sec1_guide_summary">📋 How to get your free key in 2 minutes (step by step)</summary>
          <ol class="steps-list" id="sec1_guide_steps">
            <li><strong>Create your account:</strong> Sign up for free at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org/signup</a> and verify your email.</li>
            <li><strong>Go to API settings:</strong> Open <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">themoviedb.org/settings/api</a>.</li>
            <li><strong>Create key:</strong> Click on <em>«Create»</em> and choose <strong>«Developer»</strong>.</li>
            <li><strong>Fill basic info:</strong> Accept terms and enter in the form:
              <ul class="steps-sublist">
                <li><em>Application Name:</em> Stremio Addon</li>
                <li><em>Application URL:</em> https://stremio.com</li>
                <li><em>Summary:</em> Personal catalog addon for Stremio</li>
              </ul>
            </li>
            <li><strong>Copy your key:</strong> Copy the <strong>«API Key (v3 auth)»</strong> (32 characters) or <strong>«API Read Access Token (v4)»</strong> and paste it below.</li>
          </ol>
        </details>

        <div class="form-group">
          <label for="tmdbKey" id="sec1_input_label">TMDB v3 API Key or v4 Read Access Token</label>
          <input type="text" id="tmdbKey" class="monospace-input" autocomplete="off" spellcheck="false"
                 placeholder="Paste your 32-character key or v4 token here..." required>
          <div class="help-text warning" id="sec1_input_warn">⚠️ Your key travels encoded inside the addon URL so your player can query catalogs. Do not share your personal link if you don't want to share your quota.</div>
        </div>
      </div>

      <!-- Section 2: Production Regions -->
      <div class="section">
        <div class="section-title" id="sec2_title">2. Production Regions</div>
        <div class="help-text" id="sec2_help" style="margin-bottom: 0.75rem;">
          Select which regions you want to include. If none are selected, titles from worldwide will be included.
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="region_europe" checked>
            <span id="label_europe">🇪🇺 Europe (UK, France, Spain, Italy, Germany, Nordics...)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_spain">
            <span id="label_spain">🇪🇸 Spain</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_us" checked>
            <span id="label_us">🇺🇸 United States / Hollywood</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_latam" checked>
            <span id="label_latam">🌎 Latin America (Argentina, Mexico, Brazil, Colombia...)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="region_asia">
            <span id="label_asia">🌏 Asia (Japan, South Korea, Hong Kong, India...)</span>
          </label>
        </div>
      </div>

      <!-- Section 3: Minimum Rating -->
      <div class="section">
        <div class="section-title" id="sec3_title">3. Minimum Rating (TMDB)</div>
        <div class="form-group">
          <label for="minRating" id="sec3_label">Minimum score in TMDB (0 - 10)</label>
          <select id="minRating">
            <option value="7.0" selected id="opt_rating_70">⭐ TMDB 7.0+ (Good - Recommended)</option>
            <option value="7.5" id="opt_rating_75">⭐ TMDB 7.5+ (Very Good)</option>
            <option value="8.0" id="opt_rating_80">⭐ TMDB 8.0+ (Great)</option>
            <option value="8.5" id="opt_rating_85">⭐ TMDB 8.5+ (Masterpieces)</option>
            <option value="0" id="opt_rating_0">🎬 No minimum rating (Any score)</option>
          </select>
          <div class="help-text" id="sec3_help">Filters by average user score on TMDB. Poster cards in Stremio will display this score (e.g. <em>2024 · TMDB 8.2</em>). Note that inside detail sheets, Cinemeta or other metadata addons will show IMDb scores.</div>
        </div>
      </div>

      <!-- Section 4: Minimum Votes -->
      <div class="section">
        <div class="section-title" id="sec4_title">4. Minimum Votes</div>
        <div class="form-group">
          <label for="minVotesMovie" id="sec4_label_movie">Minimum votes for movies</label>
          <input type="number" id="minVotesMovie" inputmode="numeric" placeholder="200" min="1" max="5000" step="1">
          <div class="help-text" id="sec4_help">Prevents obscure titles with few ratings and inflated scores from appearing.</div>
        </div>
        <div class="form-group">
          <label for="minVotesSeries" id="sec4_label_series">Minimum votes for series</label>
          <input type="number" id="minVotesSeries" inputmode="numeric" placeholder="50" min="1" max="2000" step="1">
        </div>
      </div>

      <!-- Section 5: Catalogs in Stremio -->
      <div class="section">
        <div class="section-title" id="sec5_title">5. Catalogs in Stremio</div>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="enableMovies" checked>
            <span id="label_enableMovies">Top Movies (with Year / Decade selector)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="enableSeries" checked>
            <span id="label_enableSeries">Top Series (with Year / Decade selector)</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="enableSearch" checked>
            <span id="label_enableSearch">Smart search in search bar ("2023 8+", "dune 2024")</span>
          </label>
        </div>
      </div>
    </form>

    <!-- Actions -->
    <div class="actions">
      <a id="installStremioBtn" href="#" class="btn btn-primary">🚀 Install in Stremio</a>
      <a id="installWebBtn" href="#" class="btn btn-secondary" target="_blank" rel="noopener">🌐 Install in Stremio Web</a>
      <button id="copyUrlBtn" type="button" class="btn btn-secondary">📋 Copy Manifest URL (Nuvio / others)</button>
      <div id="copiedToast" class="copied-toast" role="status">Link copied to clipboard!</div>
      <div id="urlPreview" class="url-preview"></div>
    </div>

    <p class="footer" id="footerText">
      This addon only provides catalogs: playback depends on stream addons installed in your player.<br>
      Data from <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.
    </p>
  </main>

  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };
      var REGION_KEYS = ['europe', 'spain', 'us', 'latam', 'asia'];
      var CONTENT_KEYS = ['enableMovies', 'enableSeries', 'enableSearch'];
      var TMDB_KEY_PATTERN = /^[A-Za-z0-9_.-]{16,1024}$/;

      var I18N = {
        en: {
          docTitle: 'Configure TMDB Catalog (Year, Country & Rating)',
          titleText: 'TMDB Catalog: Year, Country & Rating',
          subtitleText: 'Customize your catalogs, language and rating filters before installing the addon.',
          sec1_title: '1. TMDB API Key',
          sec1_info: '💡 <strong>What is this for?</strong> This addon queries <em>The Movie Database (TMDB)</em> to filter and sort movies and series by country, year and rating. To work, <strong>it requires your free TMDB API key</strong>.',
          sec1_guide_summary: '📋 How to get your free key in 2 minutes (step by step)',
          sec1_guide_steps: '<li><strong>Create your account:</strong> Sign up for free at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org/signup</a> and verify your email.</li>' +
            '<li><strong>Go to API settings:</strong> Open <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">themoviedb.org/settings/api</a>.</li>' +
            '<li><strong>Create key:</strong> Click on <em>«Create»</em> and choose <strong>«Developer»</strong>.</li>' +
            '<li><strong>Fill basic info:</strong> Accept terms and enter in the form:<ul class="steps-sublist"><li><em>Application Name:</em> Stremio Addon</li><li><em>Application URL:</em> https://stremio.com</li><li><em>Summary:</em> Personal catalog addon for Stremio</li></ul></li>' +
            '<li><strong>Copy your key:</strong> Copy the <strong>«API Key (v3 auth)»</strong> (32 characters) or <strong>«API Read Access Token (v4)»</strong> and paste it below.</li>',
          sec1_input_label: 'TMDB v3 API Key or v4 Read Access Token',
          tmdbKey_placeholder: 'Paste your 32-character key or v4 token here...',
          sec1_input_warn: '⚠️ Your key travels encoded inside the addon URL so your player can query catalogs. Do not share your personal link if you don\'t want to share your quota.',
          sec2_title: '2. Production Regions',
          sec2_help: 'Select which regions you want to include. If none are selected, titles from worldwide will be included.',
          label_europe: '🇪🇺 Europe (UK, France, Spain, Italy, Germany, Nordics...)',
          label_spain: '🇪🇸 Spain',
          label_us: '🇺🇸 United States / Hollywood',
          label_latam: '🌎 Latin America (Argentina, Mexico, Brazil, Colombia...)',
          label_asia: '🌏 Asia (Japan, South Korea, Hong Kong, India...)',
          sec3_title: '3. Minimum Rating (TMDB)',
          sec3_label: 'Minimum score in TMDB (0 - 10)',
          opt_rating_70: '⭐ TMDB 7.0+ (Good - Recommended)',
          opt_rating_75: '⭐ TMDB 7.5+ (Very Good)',
          opt_rating_80: '⭐ TMDB 8.0+ (Great)',
          opt_rating_85: '⭐ TMDB 8.5+ (Masterpieces)',
          opt_rating_0: '🎬 No minimum rating (Any score)',
          sec3_help: 'Filters by average user score on TMDB. Poster cards in Stremio will display this score (e.g. <em>2024 · TMDB 8.2</em>). Note that inside detail sheets, Cinemeta or other metadata addons will show IMDb scores.',
          sec4_title: '4. Minimum Votes',
          sec4_label_movie: 'Minimum votes for movies',
          sec4_help: 'Prevents obscure titles with few ratings and inflated scores from appearing.',
          sec4_label_series: 'Minimum votes for series',
          sec5_title: '5. Catalogs in Stremio',
          label_enableMovies: 'Top Movies (with Year / Decade selector)',
          label_enableSeries: 'Top Series (with Year / Decade selector)',
          label_enableSearch: 'Smart search in search bar ("2023 8+", "dune 2024")',
          installStremioBtn: '🚀 Install in Stremio',
          installWebBtn: '🌐 Install in Stremio Web',
          copyUrlBtn: '📋 Copy Manifest URL (Nuvio / others)',
          copiedToast: 'Link copied to clipboard!',
          copyPrompt: 'Copy the manifest URL:',
          warn_no_key: '⚠️ Enter your TMDB key to generate the install link.',
          warn_invalid_key: '⚠️ Invalid TMDB key (must be at least 16 alphanumeric characters without spaces).',
          warn_no_catalogs: '⚠️ Enable at least Movies or Series to install the addon.',
          footerText: 'This addon only provides catalogs: playback depends on stream addons installed in your player.<br>Data from <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.'
        },
        es: {
          docTitle: 'Configurar Catálogo TMDB (Año, País y Calidad)',
          titleText: 'Catálogo TMDB: Año, País y Calidad',
          subtitleText: 'Personaliza tus catálogos, idioma y umbrales de puntuación antes de instalar el addon en tu reproductor.',
          sec1_title: '1. Clave de TMDB',
          sec1_info: '💡 <strong>¿Para qué se usa?</strong> Este addon consulta la base de datos de <em>The Movie Database (TMDB)</em> para filtrar y ordenar películas y series por país, año y valoración de los usuarios de TMDB. Para poder funcionar, <strong>requiere tu clave de API gratuita</strong>.',
          sec1_guide_summary: '📋 Cómo obtener tu clave gratis en 2 minutos (paso a paso)',
          sec1_guide_steps: '<li><strong>Crea tu cuenta:</strong> Regístrate gratis en <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org/signup</a> y confirma tu email.</li>' +
            '<li><strong>Ve a la sección API:</strong> Entra en <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">themoviedb.org/settings/api</a>.</li>' +
            '<li><strong>Crea la clave:</strong> Haz clic en <em>«Crear»</em> (Create) y elige la opción <strong>«Developer»</strong> (Desarrollador).</li>' +
            '<li><strong>Rellena los datos básicos:</strong> Acepta los términos y escribe en el formulario:<ul class="steps-sublist"><li><em>Nombre de aplicación:</em> Stremio Addon</li><li><em>URL de aplicación:</em> https://stremio.com</li><li><em>Resumen:</em> Addon de catálogos personales para Stremio</li></ul></li>' +
            '<li><strong>Copia la clave:</strong> Copia la <strong>«Clave de API (v3 auth)»</strong> (32 caracteres alfanuméricos) o el <strong>«Token de lectura (v4)»</strong> y pégalo abajo.</li>',
          sec1_input_label: 'Clave API v3 o token v4 de TheMovieDB',
          tmdbKey_placeholder: 'Pega aquí tu clave v3 (32 caracteres) o token v4...',
          sec1_input_warn: '⚠️ La clave viaja codificada dentro de la URL del addon para que tu reproductor consulte los catálogos. No compartas tu enlace personal si no deseas prestar tu cuota.',
          sec2_title: '2. Regiones de interés',
          sec2_help: 'Marca las procedencias que te interesan. Si no marcas ninguna, se incluirán producciones de todo el mundo.',
          label_europe: '🇪🇺 Europa (Reino Unido, Francia, España, Italia, Alemania, Nórdicos...)',
          label_spain: '🇪🇸 España',
          label_us: '🇺🇸 Estados Unidos / Hollywood',
          label_latam: '🌎 Latinoamérica (Argentina, México, Brasil, Colombia...)',
          label_asia: '🌏 Asia (Japón, Corea del Sur, Hong Kong, India...)',
          sec3_title: '3. Nota mínima de corte (TMDB)',
          sec3_label: 'Puntuación mínima en TMDB (0 - 10)',
          opt_rating_70: '⭐ TMDB 7.0+ (Notable - Recomendado)',
          opt_rating_75: '⭐ TMDB 7.5+ (Notable Alto)',
          opt_rating_80: '⭐ TMDB 8.0+ (Sobresaliente)',
          opt_rating_85: '⭐ TMDB 8.5+ (Obras Maestras)',
          opt_rating_0: '🎬 Sin nota mínima (Cualquier puntuación)',
          sec3_help: 'Filtra por la valoración media en TMDB. La carátula en Stremio mostrará esta nota (ej. <em>2024 · TMDB 8.2</em>). Ten en cuenta que si tienes otros addons de metadatos (como Cinemeta), estos mostrarán dentro de la ficha la nota de IMDb, que suele diferir de la de TMDB.',
          sec4_title: '4. Votos mínimos',
          sec4_label_movie: 'Mínimo de votos para películas',
          sec4_help: 'Evita que aparezcan títulos desconocidos con pocas valoraciones y notas infladas.',
          sec4_label_series: 'Mínimo de votos para series',
          sec5_title: '5. Catálogos en Stremio',
          label_enableMovies: 'Mejores Películas (con selector de Año / Época)',
          label_enableSeries: 'Mejores Series (con selector de Año / Época)',
          label_enableSearch: 'Búsqueda inteligente en la barra de búsqueda («2023 8+», «dune 2024»)',
          installStremioBtn: '🚀 Instalar en Stremio',
          installWebBtn: '🌐 Instalar en Stremio Web',
          copyUrlBtn: '📋 Copiar URL del manifiesto (Nuvio / otros)',
          copiedToast: '¡Enlace copiado al portapapeles!',
          copyPrompt: 'Copia la URL del manifiesto:',
          warn_no_key: '⚠️ Introduce tu clave de TMDB para generar el enlace de instalación.',
          warn_invalid_key: '⚠️ La clave de TMDB no es válida (debe tener al menos 16 caracteres alfanuméricos sin espacios).',
          warn_no_catalogs: '⚠️ Activa al menos Películas o Series para instalar el addon.',
          footerText: 'Este addon solo proporciona catálogos: la reproducción depende de los addons de streams que tengas instalados.<br>Datos de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.'
        }
      };

      var currentLang = 'en';

      function setLanguage(lang) {
        currentLang = lang === 'es' ? 'es' : 'en';
        document.documentElement.lang = currentLang;

        $('btn_en').classList.toggle('active', currentLang === 'en');
        $('btn_es').classList.toggle('active', currentLang === 'es');

        var t = I18N[currentLang];
        document.title = t.docTitle;
        $('titleText').textContent = t.titleText;
        $('subtitleText').textContent = t.subtitleText;

        $('sec1_title').textContent = t.sec1_title;
        $('sec1_info').innerHTML = t.sec1_info;
        $('sec1_guide_summary').textContent = t.sec1_guide_summary;
        $('sec1_guide_steps').innerHTML = t.sec1_guide_steps;
        $('sec1_input_label').textContent = t.sec1_input_label;
        $('tmdbKey').placeholder = t.tmdbKey_placeholder;
        $('sec1_input_warn').textContent = t.sec1_input_warn;

        $('sec2_title').textContent = t.sec2_title;
        $('sec2_help').textContent = t.sec2_help;
        $('label_europe').textContent = t.label_europe;
        $('label_spain').textContent = t.label_spain;
        $('label_us').textContent = t.label_us;
        $('label_latam').textContent = t.label_latam;
        $('label_asia').textContent = t.label_asia;

        $('sec3_title').textContent = t.sec3_title;
        $('sec3_label').textContent = t.sec3_label;
        $('opt_rating_70').textContent = t.opt_rating_70;
        $('opt_rating_75').textContent = t.opt_rating_75;
        $('opt_rating_80').textContent = t.opt_rating_80;
        $('opt_rating_85').textContent = t.opt_rating_85;
        $('opt_rating_0').textContent = t.opt_rating_0;
        $('sec3_help').innerHTML = t.sec3_help;

        $('sec4_title').textContent = t.sec4_title;
        $('sec4_label_movie').textContent = t.sec4_label_movie;
        $('sec4_help').textContent = t.sec4_help;
        $('sec4_label_series').textContent = t.sec4_label_series;

        $('sec5_title').textContent = t.sec5_title;
        $('label_enableMovies').textContent = t.label_enableMovies;
        $('label_enableSeries').textContent = t.label_enableSeries;
        $('label_enableSearch').textContent = t.label_enableSearch;

        $('installStremioBtn').textContent = t.installStremioBtn;
        $('installWebBtn').textContent = t.installWebBtn;
        $('copyUrlBtn').textContent = t.copyUrlBtn;
        $('copiedToast').textContent = t.copiedToast;
        $('footerText').innerHTML = t.footerText;

        generate();
      }

      $('btn_en').addEventListener('click', function () { setLanguage('en'); });
      $('btn_es').addEventListener('click', function () { setLanguage('es'); });

      function toBase64Url(str) {
        var bytes = new TextEncoder().encode(str);
        var bin = '';
        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
        return btoa(bin).split('+').join('-').split('/').join('_').replace(/=+$/, '');
      }

      function fromBase64Url(str) {
        var b64 = str.split('-').join('+').split('_').join('/');
        while (b64.length % 4) b64 += '=';
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      }

      // Base path calculation
      var path = window.location.pathname;
      while (path.length > 1 && path.endsWith('/')) { path = path.slice(0, -1); }
      var segments = path.split('/').filter(Boolean);
      var isConfigureEnd = segments.length > 0 && segments[segments.length - 1] === 'configure';
      var existingConfig = segments.length >= 2 && isConfigureEnd ? segments[segments.length - 2] : null;
      var basePathSegments = isConfigureEnd ? segments.slice(0, existingConfig ? -2 : -1) : segments;
      var basePath = '/' + basePathSegments.join('/');
      if (basePath === '/') basePath = '';
      var origin = window.location.origin + basePath;

      var detectedLang = (navigator.language || navigator.userLanguage || '').toLowerCase().startsWith('es') ? 'es' : 'en';

      // Load existing configuration if present
      if (existingConfig) {
        try {
          var current = JSON.parse(fromBase64Url(existingConfig));
          if (current && typeof current === 'object') {
            if (current.language === 'es' || current.language === 'en') {
              detectedLang = current.language;
            }
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
        } catch (e) { /* use defaults */ }
      }

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
        var config = { language: currentLang };
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
        var stremioUrl = manifestUrl.replace('http://', 'stremio://').replace('https://', 'stremio://');
        var webUrl = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(manifestUrl);

        $('installStremioBtn').href = canInstall ? stremioUrl : '#';
        $('installWebBtn').href = canInstall ? webUrl : '#';
        ['installStremioBtn', 'installWebBtn', 'copyUrlBtn'].forEach(function (id) {
          $(id).setAttribute('aria-disabled', canInstall ? 'false' : 'true');
        });

        var t = I18N[currentLang];
        if (!key) {
          $('urlPreview').textContent = t.warn_no_key;
        } else if (!keyValid) {
          $('urlPreview').textContent = t.warn_invalid_key;
        } else if (!catalogsEnabled) {
          $('urlPreview').textContent = t.warn_no_catalogs;
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
        var promptText = I18N[currentLang].copyPrompt;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt(promptText, url); });
        } else {
          window.prompt(promptText, url);
        }
      });

      setLanguage(detectedLang);
    })();
  </script>
</body>
</html>
`;
