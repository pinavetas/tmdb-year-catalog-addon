/**
 * Sistema visual de la familia Pina (el mismo de PinaSports, `live-sport-plugin/public/ui.css`).
 *
 * Aspecto de retransmisión: superficies casi negras, tipografía condensada de marcador (Barlow
 * Condensed) para títulos y etiquetas, Inter para el texto, y un único acento lima para estados
 * activos y la acción principal. Solo tema oscuro, a propósito: las páginas se usan junto a la TV.
 * Todos los controles tienen foco visible (teclado o mando de TV).
 *
 * Reglas: no añadir colores sueltos en las páginas; usar estos tokens. El coral (#ff5e5b) solo
 * aparece en la tarjeta de Ko-fi.
 */
export const PINA_CSS = String.raw`
:root {
  --bg: #0a0c0f;
  --bg-raise: #0e1115;
  --surface: #12161b;
  --surface-2: #181d23;
  --surface-3: #1f252d;
  --line: #232a33;
  --line-strong: #364050;

  --text: #eef1f5;
  --muted: #9ba5b4;
  --faint: #7a8494;

  --accent: #c6ff3d;
  --accent-hover: #d4ff6b;
  --accent-ink: #0a0c0f;
  --accent-soft: rgba(198, 255, 61, 0.10);
  --accent-line: rgba(198, 255, 61, 0.30);
  --ok: #3ddc84;
  --warn: #ffb020;
  --bad: #ff5a5a;
  --focus: #c6ff3d;
  --kofi: #ff5e5b;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px;

  --font-display: "Barlow Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --topbar-h: 60px;
  color-scheme: dark;
}

/* ---------- Base ---------- */
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; min-height: 100vh;
  background: var(--bg); color: var(--text);
  font: 400 15px/1.55 var(--font-sans);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
h1, h2, h3 { margin: 0; font-family: var(--font-display); font-weight: 700; letter-spacing: 0.01em; }
p { margin: 0; }
a { color: var(--accent); }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
::selection { background: var(--accent); color: var(--accent-ink); }

/* Textura de líneas tenues detrás del encabezado de página */
.pitch-bg {
  background:
    radial-gradient(1100px 380px at 8% -40%, rgba(198, 255, 61, 0.10), transparent 60%),
    repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.022) 0 2px, transparent 2px 14px),
    var(--bg-raise);
}

/* ---------- Barra superior ---------- */
.topbar {
  position: sticky; top: 0; z-index: 60;
  display: flex; align-items: center; gap: var(--space-4);
  height: var(--topbar-h); padding: 0 var(--space-6);
  background: rgba(10, 12, 15, 0.86);
  -webkit-backdrop-filter: saturate(140%) blur(12px); backdrop-filter: saturate(140%) blur(12px);
  border-bottom: 1px solid var(--line);
}
.brand { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; white-space: nowrap; }
.brand-mark {
  display: inline-grid; place-items: center; flex: none;
  width: 30px; height: 30px; border-radius: 7px;
  background: var(--accent); color: var(--accent-ink);
  transform: skewX(-8deg);
}
.brand-mark svg { width: 18px; height: 18px; transform: skewX(8deg); }
.brand-word { font: 800 21px/1 var(--font-display); letter-spacing: 0.05em; text-transform: uppercase; }
.brand-word b { color: var(--accent); font-weight: 800; }
.topbar .spacer { flex: 1; }
.topbar-meta { color: var(--faint); font: 600 13px/1 var(--font-display); letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }

/* Selector de idioma EN | ES */
.lang-switcher { display: inline-flex; align-items: center; gap: 2px; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--bg); }
.lang-btn {
  min-height: 28px; padding: 0 10px; border: 0; border-radius: 4px;
  background: transparent; color: var(--muted);
  font: 700 12px/1 var(--font-display); letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
}
.lang-btn:hover { color: var(--text); background: var(--surface-3); }
.lang-btn[aria-pressed="true"] { color: var(--accent); background: var(--surface-2); font-weight: 800; }

/* ---------- Botones ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 42px; padding: 0 18px;
  border: 1px solid var(--line-strong); border-radius: var(--radius-md);
  background: var(--surface-2); color: var(--text);
  font: 600 14px/1 var(--font-sans); text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease, transform .15s ease;
}
.btn:hover { background: var(--surface-3); border-color: var(--faint); }
.btn:active { transform: translateY(1px); }
.btn svg { width: 18px; height: 18px; flex: none; }
.btn[aria-disabled="true"], .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn[aria-disabled="true"]:active { transform: none; }
.btn-primary {
  border-color: var(--accent); background: var(--accent); color: var(--accent-ink);
  font: 700 17px/1 var(--font-display); letter-spacing: 0.08em; text-transform: uppercase;
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn-lg { min-height: 54px; padding: 0 24px; font-size: 19px; }
.btn-block { width: 100%; }
.btn-sm { min-height: 34px; padding: 0 12px; font-size: 13px; border-radius: var(--radius-sm); }

/* Botones pequeños «Todas · Ninguna» */
.mini-actions { display: inline-flex; align-items: center; gap: 2px; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--bg); }
.mini-actions button {
  min-height: 26px; padding: 0 10px; border: 0; border-radius: 4px; background: transparent; color: var(--muted);
  font: 600 12px/1 var(--font-display); letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
}
.mini-actions button:hover { background: var(--surface-3); color: var(--text); }

/* ---------- Encabezado de página ---------- */
.hero { border-bottom: 1px solid var(--line); }
.hero-inner { max-width: 1320px; margin: 0 auto; padding: var(--space-10) var(--space-6) var(--space-8); }
.eyebrow {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: var(--space-3);
  color: var(--accent); font: 700 13px/1 var(--font-display); letter-spacing: 0.18em; text-transform: uppercase;
}
.eyebrow::before { content: ""; width: 18px; height: 3px; background: currentColor; transform: skewX(-20deg); }
.hero h1 { font: 800 clamp(38px, 5.2vw, 64px)/0.95 var(--font-display); letter-spacing: 0.005em; text-transform: uppercase; }
.hero h1 em { font-style: normal; color: var(--accent); }
.hero .lede { max-width: 68ch; margin-top: var(--space-3); color: var(--muted); font-size: 16px; }

/* ---------- Avisos ---------- */
.notices { display: grid; gap: var(--space-3); }
.notice { display: flex; gap: 10px; padding: 12px 14px; border-radius: var(--radius-md); font-size: 14px; line-height: 1.5; }
.notice-warn { background: rgba(255, 90, 90, 0.10); border: 1px solid rgba(255, 90, 90, 0.35); color: #ffc9c9; }

/* ---------- Disposición: contenido + carril de instalación ---------- */
.setup {
  display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: var(--space-6);
  max-width: 1320px; margin: 0 auto; padding: var(--space-6); align-items: start;
}
.setup-main { display: grid; gap: var(--space-5); min-width: 0; }
.setup-rail { position: sticky; top: calc(var(--topbar-h) + var(--space-6)); display: grid; gap: var(--space-4); }

/* ---------- Paneles y cabeceras de sección ---------- */
.panel { padding: var(--space-6); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-5); }
.section-title { display: flex; align-items: baseline; gap: var(--space-3); }
.section-index { color: var(--accent); font: 800 15px/1 var(--font-display); letter-spacing: 0.08em; }
.section-title h2 { font: 700 28px/1 var(--font-display); letter-spacing: 0.03em; text-transform: uppercase; }
.section-sub { margin-top: 6px; color: var(--muted); font-size: 14px; }
.section-tools { display: flex; align-items: center; gap: var(--space-3); }
.counter {
  display: inline-flex; align-items: baseline; gap: 1px; min-width: 56px; justify-content: center;
  padding: 5px 10px; border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--line);
  font: 700 18px/1 var(--font-display); font-variant-numeric: tabular-nums; letter-spacing: 0.04em;
}
.counter .of { color: var(--faint); font-weight: 600; font-size: 15px; }
.counter.is-full { color: var(--accent); }
.counter.is-empty { color: var(--bad); }
.group-label {
  display: flex; align-items: center; gap: var(--space-2); margin: var(--space-6) 0 var(--space-3);
  color: var(--muted); font: 700 13px/1 var(--font-display); letter-spacing: 0.16em; text-transform: uppercase;
}
.group-label::after { content: ""; flex: 1; height: 1px; background: var(--line); }

/* ---------- Baldosas activables (fuentes, deportes…) ---------- */
.tile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: var(--space-2); }
.tile {
  position: relative; display: flex; align-items: center; gap: 10px;
  min-height: 56px; padding: 8px 34px 8px 10px;
  border: 1px solid var(--line); border-radius: var(--radius-md);
  background: var(--surface-2); color: var(--muted); cursor: pointer; user-select: none;
  transition: border-color .15s ease, background-color .15s ease, color .15s ease;
}
.tile:hover { border-color: var(--line-strong); color: var(--text); }
.tile input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; pointer-events: none; }
.tile:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.tile-ico {
  display: inline-grid; place-items: center; flex: none; width: 32px; height: 32px;
  border-radius: var(--radius-sm); background: var(--surface-3); color: var(--faint);
  font: 700 13px/1 var(--font-display); letter-spacing: 0.04em;
  transition: background-color .15s ease, color .15s ease;
}
.tile-ico svg { width: 18px; height: 18px; }
.tile-text { display: grid; min-width: 0; gap: 3px; }
.tile-label { color: inherit; font: 600 14px/1.2 var(--font-sans); overflow-wrap: anywhere; }
.tile-sub { color: var(--faint); font: 600 11px/1.2 var(--font-display); letter-spacing: 0.12em; text-transform: uppercase; }
.tile-check {
  position: absolute; top: 50%; right: 10px; width: 16px; height: 16px; margin-top: -8px;
  border: 1.5px solid var(--line-strong); border-radius: 4px;
  transition: background-color .15s ease, border-color .15s ease;
}
.tile-check::after {
  content: ""; position: absolute; left: 4.5px; top: 1.5px; width: 4px; height: 8px;
  border: solid var(--accent-ink); border-width: 0 2px 2px 0; transform: rotate(45deg); opacity: 0;
}
.tile.is-on { border-color: var(--accent-line); background: linear-gradient(180deg, rgba(198, 255, 61, 0.08), rgba(198, 255, 61, 0.03)); color: var(--text); }
.tile.is-on .tile-ico { background: var(--accent-soft); color: var(--accent); }
.tile.is-on .tile-check { border-color: var(--accent); background: var(--accent); }
.tile.is-on .tile-check::after { opacity: 1; }

/* ---------- Campos ---------- */
.field { display: grid; gap: 8px; align-content: start; }
.field + .field { margin-top: var(--space-5); }
.field-label, .field > label { display: flex; align-items: center; gap: 8px; color: var(--text); font: 700 13px/1 var(--font-display); letter-spacing: 0.14em; text-transform: uppercase; }
.hint { color: var(--faint); font-size: 13px; line-height: 1.5; }
.pill { padding: 3px 8px; border-radius: var(--radius-pill); background: var(--surface-3); color: var(--muted); font: 700 11px/1 var(--font-display); letter-spacing: 0.1em; text-transform: uppercase; }
.input, .field input[type="text"], .field input[type="number"], .field select {
  width: 100%; min-height: 46px; padding: 0 14px;
  border: 1px solid var(--line-strong); border-radius: var(--radius-md);
  background: var(--bg); color: var(--text); font: 400 15px/1.2 var(--font-sans);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.field input::placeholder { color: var(--faint); }
.field input:hover, .field select:hover { border-color: var(--faint); }
.field input:focus, .field select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.mono-field { font-family: var(--font-mono) !important; font-size: 12.5px !important; color: var(--muted) !important; }
.prefs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5) var(--space-6); }
.prefs-grid .span-2 { grid-column: 1 / -1; }
.prefs-grid .field + .field { margin-top: 0; }

/* Control segmentado (una opción entre varias) */
.segmented { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 3px; padding: 3px; border: 1px solid var(--line-strong); border-radius: var(--radius-md); background: var(--bg); }
.segmented label { position: relative; display: block; cursor: pointer; }
.segmented input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.segmented span {
  display: flex; align-items: center; justify-content: center; min-height: 38px; padding: 4px 8px;
  border-radius: 7px; color: var(--muted); text-align: center;
  font: 700 15px/1.1 var(--font-display); letter-spacing: 0.06em; text-transform: uppercase;
  transition: background-color .15s ease, color .15s ease;
}
.segmented label:hover span { color: var(--text); }
.segmented input:checked + span { background: var(--accent); color: var(--accent-ink); }
.segmented input:focus-visible + span { outline: 2px solid var(--focus); outline-offset: 2px; }

/* Selector numérico − n + */
.stepper { display: inline-flex; align-items: stretch; width: max-content; border: 1px solid var(--line-strong); border-radius: var(--radius-md); overflow: hidden; background: var(--bg); }
.stepper button { width: 46px; border: 0; background: none; color: var(--text); font-size: 20px; cursor: pointer; }
.stepper button:hover { background: var(--surface-3); }
.stepper input[type="number"] {
  width: 70px; min-height: 44px; border: 0; border-left: 1px solid var(--line); border-right: 1px solid var(--line);
  border-radius: 0; background: transparent; text-align: center;
  font: 700 20px/1 var(--font-display); font-variant-numeric: tabular-nums; -moz-appearance: textfield;
}
.stepper input::-webkit-outer-spin-button, .stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.stepper input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }

/* Interruptor (sí/no con explicación) */
.toggle { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-3) 0; cursor: pointer; }
.toggle + .toggle { border-top: 1px solid var(--line); }
.toggle-title { display: block; color: var(--text); font-weight: 600; font-size: 14.5px; }
.toggle .hint { display: block; margin-top: 2px; }
input.switch { appearance: none; -webkit-appearance: none; flex: none; position: relative; width: 46px; height: 28px; margin: 0; border-radius: var(--radius-pill); background: var(--line-strong); cursor: pointer; transition: background-color .15s ease; }
input.switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--muted); transition: transform .15s ease, background-color .15s ease; }
input.switch:checked { background: var(--accent); }
input.switch:checked::after { transform: translateX(18px); background: var(--accent-ink); }

/* Chips (listas ordenables) */
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 6px 4px 10px; border-radius: var(--radius-pill); font-size: 13.5px; font-weight: 600; }
.chip-on { background: var(--accent-soft); border: 1px solid var(--accent-line); color: var(--text); }
.chip-rank { display: inline-grid; place-items: center; min-width: 20px; height: 20px; border-radius: var(--radius-pill); background: var(--accent); color: var(--accent-ink); font: 800 12px/1 var(--font-display); }
.chip-btn { display: inline-grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 50%; background: transparent; color: var(--muted); font-size: 14px; cursor: pointer; }
.chip-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); }
.chip-add { padding: 4px 12px; border: 1px dashed var(--line-strong); background: transparent; color: var(--muted); cursor: pointer; }
.chip-add:hover { color: var(--text); border-color: var(--accent); }
.chip-add:disabled { opacity: 0.4; cursor: not-allowed; }
.chip-empty { color: var(--faint); font-size: 13.5px; padding: 6px 0; }

/* Desplegables */
.disclosure { border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--bg); }
.disclosure > summary {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  min-height: 44px; padding: 0 14px; color: var(--muted); font-size: 14px; font-weight: 600; cursor: pointer; list-style: none;
}
.disclosure > summary::-webkit-details-marker { display: none; }
.disclosure > summary::after { content: ""; width: 8px; height: 8px; flex: none; border: solid var(--faint); border-width: 0 2px 2px 0; transform: rotate(45deg) translateY(-2px); transition: transform .2s ease; }
.disclosure[open] > summary::after { transform: rotate(-135deg) translateY(-2px); }
.disclosure > summary:hover { color: var(--text); }
.disclosure-body { padding: 0 14px 14px; color: var(--muted); font-size: 13.5px; line-height: 1.6; }
.disclosure-body ol, .disclosure-body ul { margin: 0; padding-left: 20px; }
.disclosure-body li + li { margin-top: 4px; }
.disclosure-body strong { color: var(--text); font-weight: 600; }

/* Estado (verificación de claves, copiado…) */
.status { color: var(--muted); font-size: 13px; font-weight: 600; }
.status:empty { display: none; }
.status.is-ok { color: var(--ok); }
.status.is-err { color: var(--bad); }

/* Lista de comprobaciones (prueba de conexión) */
.check-list { display: grid; gap: 6px; margin: var(--space-3) 0 0; padding: 0; list-style: none; }
.check-list li { display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px; border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--line); font-size: 13.5px; }
.check-list .ok { color: var(--ok); font-weight: 600; }
.check-list .bad { color: var(--bad); font-weight: 600; text-align: right; }
.check-list .skip { color: var(--muted); text-align: right; }

/* ---------- Tarjeta de apoyo (Ko-fi), siempre encima de la de instalación ---------- */
.support-card { position: relative; overflow: hidden; padding: var(--space-5) var(--space-6); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); }
.support-card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, var(--kofi), var(--accent)); }
.support-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.support-icon { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: var(--radius-sm); background: rgba(255, 94, 91, 0.15); border: 1px solid rgba(255, 94, 91, 0.3); font-size: 20px; }
.support-title { margin: 0; color: var(--text); font: 700 17px/1.2 var(--font-display); letter-spacing: 0.04em; text-transform: uppercase; }
.support-sub { margin: 2px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.4; }
.support-actions { display: grid; gap: var(--space-2); }
.btn-kofi {
  display: flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 16px;
  border-radius: var(--radius-sm); background: var(--kofi); color: #fff; font-weight: 700; font-size: 13.5px;
  text-decoration: none; box-shadow: 0 4px 12px rgba(255, 94, 91, 0.25); transition: background-color .15s ease;
}
.btn-kofi:hover { background: #e04f4c; color: #fff; }
.support-hub-link { color: var(--accent); font-size: 12px; font-weight: 600; text-align: center; text-decoration: none; }
.support-hub-link:hover { text-decoration: underline; }

/* ---------- Tarjeta de instalación: marcador de la configuración + acciones ---------- */
.install-card { position: relative; overflow: hidden; padding: 0; }
.install-card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--accent); }
.install-head { padding: var(--space-6) var(--space-6) var(--space-4); }
.install-head .eyebrow { margin-bottom: var(--space-2); }
.install-head h2 { font: 800 30px/1 var(--font-display); text-transform: uppercase; letter-spacing: 0.02em; }
.summary { list-style: none; margin: 0; padding: 0 var(--space-6); }
.summary li { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4); padding: 9px 0; border-top: 1px solid var(--line); }
.summary li span { color: var(--faint); font: 700 12px/1.2 var(--font-display); letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; }
.summary li b { min-width: 0; overflow: hidden; color: var(--text); font: 600 17px/1.2 var(--font-display); letter-spacing: 0.03em; text-align: right; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.summary li b.is-accent { color: var(--accent); }
.summary li b.is-bad { color: var(--bad); }
.install-actions { display: grid; gap: var(--space-3); padding: var(--space-5) var(--space-6) var(--space-6); border-top: 1px solid var(--line); background: var(--bg-raise); }
.install-actions .field { margin-top: var(--space-2); }

/* Barra de instalación fija en móvil (aparece cuando la tarjeta queda fuera de pantalla) */
.install-dock {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 70;
  display: none; align-items: center; gap: var(--space-3);
  padding: 10px var(--space-4) calc(10px + env(safe-area-inset-bottom));
  background: rgba(14, 17, 21, 0.94); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border-top: 1px solid var(--line); transform: translateY(110%); transition: transform .25s ease;
}
.install-dock.is-shown { transform: none; }
.install-dock .dock-text { flex: 1; min-width: 0; overflow: hidden; color: var(--muted); font: 600 14px/1.2 var(--font-display); letter-spacing: 0.08em; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap; }
.install-dock .dock-text b { color: var(--text); font-weight: 700; }
.install-dock .btn-primary { min-height: 44px; padding: 0 18px; }

/* ---------- Pie ---------- */
.site-foot {
  max-width: 1320px; margin: 0 auto; padding: var(--space-8) var(--space-6) var(--space-10);
  display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); justify-content: space-between;
  color: var(--faint); font-size: 13px;
}
.site-foot a { color: var(--muted); text-decoration: none; }
.site-foot a:hover { color: var(--text); }

/* ---------- Adaptación a pantallas ---------- */
@media (max-width: 1099px) {
  .setup { grid-template-columns: minmax(0, 1fr); }
  .setup-rail { position: static; }
  .install-dock { display: flex; }
  body { padding-bottom: 76px; }
}
@media (max-width: 760px) {
  :root { --topbar-h: 56px; }
  .topbar { gap: var(--space-3); padding: 0 var(--space-4); }
  .brand-word { font-size: 19px; }
  .topbar-meta { display: none; }
  .hero-inner { padding: var(--space-8) var(--space-4) var(--space-6); }
  .setup { padding: var(--space-4); gap: var(--space-4); }
  .setup-main { gap: var(--space-4); }
  .panel { padding: var(--space-4); border-radius: var(--radius-md); }
  .section-title h2 { font-size: 24px; }
  .prefs-grid { grid-template-columns: minmax(0, 1fr); }
  .tile-grid { grid-template-columns: minmax(0, 1fr); }
  .install-head { padding: var(--space-5) var(--space-4) var(--space-3); }
  .summary { padding: 0 var(--space-4); }
  .install-actions { padding: var(--space-4); }
  .support-card { padding: var(--space-4); }
  .site-foot { padding: var(--space-6) var(--space-4) var(--space-8); }
}
@media (max-width: 420px) {
  .brand-word { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
`;
