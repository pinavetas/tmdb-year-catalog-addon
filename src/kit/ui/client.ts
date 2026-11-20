/**
 * Código de navegador común a las páginas de configuración (window.PinaKit).
 *
 * Se incrusta como texto: escrito en ES5 (var/function) para navegadores antiguos de TV y móvil.
 * IMPORTANTE: es un String.raw; no usar backticks ni "${" dentro.
 *
 * API para el script de cada addon (ver docs/PINA_ADDON_KIT.md):
 *   PinaKit.t(key, vars)            texto traducido ({var} sustituidas)
 *   PinaKit.lang                    'en' | 'es' (guárdalo en la configuración como `lang`)
 *   PinaKit.onLang(fn)              se llama al cambiar de idioma (repintar textos dinámicos)
 *   PinaKit.$(id), PinaKit.el(tag, className, text)
 *   PinaKit.readPathConfig()        configuración existente de /<config>/configure (o null)
 *   PinaKit.newInstallId()          identificador aleatorio y anónimo de instalación
 *   PinaKit.bindTiles(gridId, opts) baldosas: pintado, contador y botones Todas/Ninguna
 *   PinaKit.bindInstall(read)       read() ➔ { config, ready, summary: [{k, v, tone}], dock: [{v, label}] }
 *   PinaKit.refresh()               recalcula enlace, resumen y barra móvil
 *   PinaKit.start()                 aplica el idioma y pinta todo (llamar al final del script del addon)
 */
export const CLIENT_RUNTIME = String.raw`
(function () {
  'use strict';
  var BOOT = window.PINA_BOOT || {};
  var DICT = BOOT.i18n || { en: {}, es: {} };
  var STORAGE_KEY = 'pina_lang';
  var langListeners = [];
  var reader = null;
  var current = null;
  var copyTimer = null;

  function $(id) { return document.getElementById(id); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function t(key, vars) {
    var dict = DICT[api.lang] || DICT.en;
    var value = dict[key];
    if (value === undefined) value = DICT.en[key];
    if (value === undefined) value = key;
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] !== undefined && vars[name] !== null ? String(vars[name]) : match;
      });
    }
    return value;
  }

  // --- Idioma: el de la instalación ➔ elección guardada ➔ español si el navegador lo incluye ➔ inglés ---
  function detectLang() {
    var fromConfig = readPathConfig();
    var configLang = fromConfig && (fromConfig.lang || fromConfig.language);
    if (configLang === 'en' || configLang === 'es') return configLang;
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch (e) {}
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      if (String(langs[i] || '').toLowerCase().indexOf('es') === 0) return 'es';
    }
    return 'en';
  }

  function applyLang(lang, persist) {
    api.lang = DICT[lang] ? lang : 'en';
    if (persist) {
      try { window.localStorage.setItem(STORAGE_KEY, api.lang); } catch (e) {}
    }
    document.documentElement.lang = api.lang;
    qsa('[data-i18n]').forEach(function (node) { node.textContent = t(node.getAttribute('data-i18n')); });
    // Solo textos propios del diccionario (enlaces de las guías): nunca datos del usuario
    qsa('[data-i18n-html]').forEach(function (node) { node.innerHTML = t(node.getAttribute('data-i18n-html')); });
    qsa('[data-i18n-placeholder]').forEach(function (node) { node.setAttribute('placeholder', t(node.getAttribute('data-i18n-placeholder'))); });
    qsa('[data-i18n-aria]').forEach(function (node) { node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria'))); });
    if (DICT.en.page_title) document.title = t('page_title');
    qsa('.lang-btn[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === api.lang));
    });
    langListeners.forEach(function (fn) { fn(api.lang); });
    refresh();
  }

  // --- Configuración en la URL: JSON en base64url ---
  function encodeB64Url(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeB64Url(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }
  function readPathConfig() {
    try {
      var parts = window.location.pathname.split('/').filter(Boolean);
      var idx = parts.indexOf('configure') - 1;
      if (idx >= 0 && parts[idx]) {
        var value = JSON.parse(decodeB64Url(parts[idx]));
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
      }
    } catch (e) {}
    return null;
  }
  function newInstallId() {
    var bytes = new Uint8Array(12);
    var cryptoObj = window.crypto || window.msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      cryptoObj.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    var bin = '';
    for (var j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  var BASE = BOOT.publicBaseUrl || (window.location.protocol + '//' + window.location.host);

  // --- Baldosas activables ---
  function paintCounter(id, on, total) {
    var node = $(id);
    if (!node) return;
    node.innerHTML = Number(on) + '<span class="of">/' + Number(total) + '</span>';
    node.classList.toggle('is-full', on === total);
    node.classList.toggle('is-empty', on === 0);
  }
  function bindTiles(gridId, opts) {
    opts = opts || {};
    var inputs = qsa('#' + gridId + ' input[type="checkbox"]');
    function paint() {
      var on = 0;
      inputs.forEach(function (cb) {
        var tile = cb.closest('.tile');
        if (tile) tile.classList.toggle('is-on', cb.checked);
        if (cb.checked) on++;
      });
      if (opts.counterId) paintCounter(opts.counterId, on, inputs.length);
    }
    function changed() { paint(); if (opts.onChange) opts.onChange(); }
    inputs.forEach(function (cb) { cb.addEventListener('change', changed); });
    function setAll(value) { inputs.forEach(function (cb) { cb.checked = value; }); changed(); }
    if (opts.allId && $(opts.allId)) $(opts.allId).addEventListener('click', function () { setAll(true); });
    if (opts.noneId && $(opts.noneId)) $(opts.noneId).addEventListener('click', function () { setAll(false); });
    paint();
    return {
      inputs: inputs,
      paint: paint,
      checked: function (value) {
        for (var i = 0; i < inputs.length; i++) if (inputs[i].value === value) return inputs[i].checked;
        return false;
      },
      set: function (value, on) {
        inputs.forEach(function (cb) { if (cb.value === value) cb.checked = Boolean(on); });
        paint();
      },
      count: function () { return inputs.filter(function (cb) { return cb.checked; }).length; }
    };
  }

  // --- Tarjeta de instalación ---
  function setStatus(message, tone) {
    var node = $('kitStatus');
    if (!node) return;
    node.textContent = message || '';
    node.className = 'status' + (tone ? ' is-' + tone : '');
  }

  function refresh() {
    if (!reader) return null;
    var state = reader() || {};
    var ready = state.ready !== false;
    var segment = encodeB64Url(JSON.stringify(state.config || {}));
    var manifestUrl = BASE + '/' + segment + '/manifest.json';
    var stremioUrl = manifestUrl.replace(/^https?:\/\//, 'stremio://');

    if ($('kitInstallBtn')) $('kitInstallBtn').href = stremioUrl;
    if ($('kitDockInstall')) $('kitDockInstall').href = stremioUrl;
    if ($('kitWebBtn')) $('kitWebBtn').href = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(manifestUrl);
    if ($('kitManifestUrl')) $('kitManifestUrl').value = ready ? manifestUrl : '';
    ['kitInstallBtn', 'kitWebBtn', 'kitCopyBtn', 'kitDockInstall'].forEach(function (id) {
      if ($(id)) $(id).setAttribute('aria-disabled', ready ? 'false' : 'true');
    });
    var statusNode = $('kitStatus');
    if (!ready) setStatus(t('kit_fix_first'), 'err');
    else if (statusNode && statusNode.getAttribute('data-kind') !== 'copy') setStatus('', '');

    var summary = $('kitSummary');
    if (summary) {
      summary.textContent = '';
      (state.summary || []).forEach(function (item) {
        var li = el('li');
        li.appendChild(el('span', '', item.k));
        var value = el('b', item.tone === 'accent' ? 'is-accent' : item.tone === 'bad' ? 'is-bad' : '', item.v);
        value.title = String(item.v);
        li.appendChild(value);
        summary.appendChild(li);
      });
    }
    var dockText = $('kitDockText');
    if (dockText) {
      dockText.textContent = '';
      (state.dock || []).forEach(function (item, index) {
        if (index > 0) dockText.appendChild(document.createTextNode(' · '));
        dockText.appendChild(el('b', '', item.v));
        dockText.appendChild(document.createTextNode(' ' + item.label));
      });
    }
    current = { base: BASE, segment: segment, manifestUrl: manifestUrl, ready: ready };
    return current;
  }

  function legacyCopy(text) {
    var ta = null;
    try {
      ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      return document.execCommand('copy') === true;
    } catch (e) {
      return false;
    } finally {
      if (ta && ta.parentNode) ta.parentNode.removeChild(ta);
    }
  }

  function flashCopyLabel(key) {
    var label = $('kitCopyLabel');
    if (!label) return;
    label.textContent = t(key);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      label.textContent = t('kit_copy');
      var statusNode = $('kitStatus');
      if (statusNode && statusNode.getAttribute('data-kind') === 'copy') { statusNode.removeAttribute('data-kind'); refresh(); }
    }, 2400);
  }

  function copyManifest() {
    var info = refresh();
    if (!info || !info.ready) return;
    var done = function (ok) {
      var statusNode = $('kitStatus');
      if (statusNode) statusNode.setAttribute('data-kind', 'copy');
      if (!ok && $('kitManifestUrl')) {
        try { $('kitManifestUrl').focus(); $('kitManifestUrl').select(); } catch (e) {}
      }
      setStatus(t(ok ? 'kit_status_ok' : 'kit_status_err'), ok ? 'ok' : 'err');
      flashCopyLabel(ok ? 'kit_copied' : 'kit_copy_failed');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(info.manifestUrl).then(function () { done(true); }, function () { done(legacyCopy(info.manifestUrl)); });
    } else {
      done(legacyCopy(info.manifestUrl));
    }
  }

  function bindInstall(read) {
    reader = read;
    // Los enlaces deshabilitados siguen siendo enfocables (aria-disabled) pero no actúan
    ['kitInstallBtn', 'kitWebBtn', 'kitDockInstall'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('click', function (event) {
        if ($(id).getAttribute('aria-disabled') === 'true') event.preventDefault();
      });
    });
    if ($('kitCopyBtn')) $('kitCopyBtn').addEventListener('click', function () {
      if ($('kitCopyBtn').getAttribute('aria-disabled') !== 'true') copyManifest();
    });
    if ($('kitManifestUrl')) $('kitManifestUrl').addEventListener('focus', function () { this.select(); });
  }

  // --- Avisos: Stremio solo instala por HTTPS (salvo 127.0.0.1 en el mismo equipo) ---
  function showNotices() {
    var isLoopback = /^(127\.0\.0\.1|localhost|\[::1\])$/.test(window.location.hostname);
    var baseIsHttp = BASE.indexOf('http:') === 0;
    var any = false;
    if (!BOOT.publicBaseUrl && isLoopback && $('kitWarnLoopback')) { $('kitWarnLoopback').hidden = false; any = true; }
    if (baseIsHttp && !isLoopback && $('kitWarnHttps')) {
      $('kitWarnHttps').hidden = false;
      any = true;
      // Una página HTTPS (Stremio Web) no puede cargar un add-on HTTP de la red local
      if ($('kitWebBtn')) $('kitWebBtn').hidden = true;
    }
    if (any && $('kitNotices')) $('kitNotices').hidden = false;
  }

  // --- Barra móvil: visible solo mientras la tarjeta de instalación está fuera de pantalla ---
  function watchDock() {
    var dock = $('kitDock');
    var panel = $('kitInstallPanel');
    if (!dock || !panel || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var visible = entries.some(function (entry) { return entry.isIntersecting; });
      dock.classList.toggle('is-shown', !visible);
      dock.setAttribute('aria-hidden', String(visible));
      if ($('kitDockInstall')) $('kitDockInstall').tabIndex = visible ? -1 : 0;
    }).observe(panel);
  }

  function start() {
    qsa('.lang-btn[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang'), true); });
    });
    showNotices();
    watchDock();
    applyLang(detectLang(), false);
  }

  var api = {
    lang: BOOT.lang || 'en',
    t: t,
    $: $,
    el: el,
    onLang: function (fn) { langListeners.push(fn); },
    readPathConfig: readPathConfig,
    newInstallId: newInstallId,
    bindTiles: bindTiles,
    paintCounter: paintCounter,
    bindInstall: bindInstall,
    refresh: refresh,
    start: start
  };
  window.PinaKit = api;
})();
`;

/**
 * Vercel Web Analytics (solo páginas vistas, sin cookies). La configuración del usuario viaja en la
 * URL (/<config>/configure) y puede llevar claves, así que se reduce a /configure y se quitan
 * consulta y fragmento antes de enviar cualquier evento.
 * Requiere activar Web Analytics en el proyecto de Vercel; el script lo sirve Vercel en /_vercel/insights.
 */
export const ANALYTICS_SNIPPET = String.raw`<script>
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.va('beforeSend', function (event) {
      try {
        var u = new URL(event.url);
        var parts = u.pathname.split('/').filter(Boolean);
        if (parts.length === 2 && parts[1] === 'configure') u.pathname = '/configure';
        u.search = '';
        u.hash = '';
        return Object.assign({}, event, { url: u.toString() });
      } catch (e) {
        return null;
      }
    });
  </script>
  <script defer src="/_vercel/insights/script.js"></script>`;
