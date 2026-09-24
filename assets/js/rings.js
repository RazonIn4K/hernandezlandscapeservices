/* Hernandez Landscape · "Growth Rings" behaviors (every page)
   - Hero rings grow once (reduced motion: drawn).
   - The Year in the Yard: a 12-month ring that opens on the current month in
     DeKalb County and shows what the crew does that season.
   - Walk your yard: tap zones on a property plan (or tick the list) and the
     quote form is prefilled with the matching service(s).
   - Storm mode: the owner flips assets/data/site-status.json {"storm": true}
     and a call-first band shows on every page. No response-time promises.
   Progressive enhancement: every piece is readable without JavaScript. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js-rings');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lang = function () { return window.siteI18n && window.siteI18n.getLanguage ? window.siteI18n.getLanguage() : (root.lang === 'es' ? 'es' : 'en'); };

  /* ---------- Season from a month (0 = January) ---------- */
  function seasonOf(month) {
    if (month === 11 || month <= 1) return 'winter';
    if (month <= 4) return 'spring';
    if (month <= 7) return 'summer';
    return 'fall';
  }
  function chicagoMonth() {
    var q = new URLSearchParams(window.location.search).get('month');
    if (q !== null && /^(1[01]|[0-9])$/.test(q)) return Number(q); // QA hook: ?month=0-11
    var m = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'numeric' }).format(new Date());
    return Number(m) - 1;
  }

  /* ---------- Site tint follows the season (every page) ---------- */
  root.setAttribute('data-season', seasonOf(chicagoMonth()));

  /* ---------- The Year in the Yard ---------- */
  function initSeasonRing() {
    var ring = $('[data-season-ring]');
    if (!ring) return;
    var buttons = $$('.month-btn', ring);
    var panels = $$('[data-season-panel]');
    var centerSeason = $('[data-ring-season]', ring);
    var centerMonth = $('[data-ring-month]', ring);
    var disc = $('.season-ring-disc', ring);
    var current = chicagoMonth();

    function select(month, focus) {
      current = (month + 12) % 12;
      var season = seasonOf(current);
      buttons.forEach(function (btn, i) {
        var on = i === current;
        btn.setAttribute('aria-checked', String(on));
        btn.tabIndex = on ? 0 : -1;
        if (on && focus) btn.focus();
      });
      panels.forEach(function (p) { p.classList.toggle('is-current', p.getAttribute('data-season-panel') === season); });
      root.setAttribute('data-season', season);
      var panel = $('[data-season-panel="' + season + '"]');
      if (centerSeason && panel) centerSeason.textContent = ($('[data-season-name]', panel) || panel).textContent.trim();
      if (centerMonth) centerMonth.textContent = buttons[current].getAttribute('aria-label');
      if (disc && !reduce) disc.style.transform = 'rotate(' + (-current * 30) + 'deg)';
      buttons.forEach(function (btn, i) { btn.style.setProperty('--a', ((i - current) * 30) + 'deg'); });
    }
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i, false); });
      btn.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select(current + 1, true); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select(current - 1, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true); }
        else if (k === 'End') { e.preventDefault(); select(11, true); }
      });
    });
    $$('[data-season-step]').forEach(function (b) {
      b.addEventListener('click', function () { select(current + Number(b.getAttribute('data-season-step')), false); });
    });
    select(current, false);
    if (window.siteI18n && window.siteI18n.onChange) window.siteI18n.onChange(function () { window.setTimeout(function () { select(current, false); }, 0); });
  }

  /* ---------- Walk your yard ---------- */
  var COPY = {
    en: { none: 'Nothing selected yet', one: '1 area selected', many: '{n} areas selected', notes: 'Yard areas', start: 'Start a quote request', add: 'Add to my quote request' },
    es: { none: 'Nada seleccionado', one: '1 área seleccionada', many: '{n} áreas seleccionadas', notes: 'Áreas del jardín', start: 'Empezar una solicitud de cotización', add: 'Agregar a mi solicitud' }
  };
  function initYard() {
    var box = $('[data-yard]');
    if (!box) return;
    var inputs = $$('input[name="yard-zone"]', box);
    var zones = $$('.zone[data-zone]', box);
    var count = $('[data-yard-count]', box);
    var cta = $('[data-yard-cta]', box);
    if (!cta) return;
    var ctaLabel = $('span', cta);
    var service = document.getElementById('contactService');
    var yardField = document.getElementById('yardAreasField');
    var yardNotice = document.getElementById('yardSelectionNotice');
    var yardSummary = document.getElementById('yardSelectionText');
    var details = document.getElementById('projectDetails');
    var lastYardService = null;
    var lastPicked = [];
    var yardOwnsService = false;
    var settingService = false;

    function chosen() { return inputs.filter(function (i) { return i.checked; }); }
    function selectedValues() {
      return chosen().map(function (i) { return i.value; }).filter(function (v, i, values) { return values.indexOf(v) === i; });
    }
    function yardLabels(picked) {
      return picked.map(function (i) { var label = $('[data-yard-name]', i.closest('label')); return label ? label.textContent.trim() : i.value; });
    }
    function renderAppliedYard() {
      var labels = yardLabels(lastPicked);
      var t = COPY[lang()] || COPY.en;
      if (yardField) yardField.value = labels.length ? t.notes + ': ' + labels.join(', ') : '';
      if (yardSummary) yardSummary.textContent = labels.join(', ');
      if (yardNotice) yardNotice.classList.toggle('hidden', !labels.length);
      if (details) {
        details.required = !labels.length;
        if (labels.length) {
          details.classList.remove('border-red-500');
          details.removeAttribute('aria-invalid');
        }
      }
    }
    function setService(value) {
      if (!service || !Array.prototype.some.call(service.options, function (option) { return option.value === value; })) return false;
      settingService = true;
      service.value = value;
      service.dispatchEvent(new Event('change', { bubbles: true }));
      settingService = false;
      return true;
    }
    function sync() {
      var picked = chosen();
      var values = picked.map(function (i) { return i.value; });
      zones.forEach(function (z) { z.classList.toggle('is-on', values.indexOf(z.getAttribute('data-zone')) !== -1); });
      var t = COPY[lang()] || COPY.en;
      if (count) count.textContent = !picked.length ? t.none : picked.length === 1 ? t.one : t.many.replace('{n}', picked.length);
      if (ctaLabel) ctaLabel.textContent = picked.length ? t.add : t.start;
      var unique = selectedValues();
      if (unique.length === 1) cta.setAttribute('data-prefill-service', unique[0]);
      else cta.removeAttribute('data-prefill-service');
      // The Spanish landing page sends the selection to the bilingual quote form.
      if (!service) {
        var query = unique.length === 1 ? '&service=' + encodeURIComponent(unique[0]) + '&yard=' + encodeURIComponent(unique[0]) :
          unique.length > 1 ? '&yard=' + encodeURIComponent(unique.join(',')) : '';
        cta.href = '/?lang=es' + query + '#quoteFormCard';
      }
    }
    inputs.forEach(function (i) { i.addEventListener('change', sync); });
    zones.forEach(function (z) {
      z.addEventListener('click', function () {
        var input = inputs.filter(function (i) { return i.id === z.getAttribute('data-for'); })[0];
        if (!input) return;
        input.checked = !input.checked;
        sync();
      });
    });
    function applyYardSelection() {
      var picked = chosen();
      var values = selectedValues();
      if (values.length === 0) {
        if (yardOwnsService && service && service.value === lastYardService) setService('');
        yardOwnsService = false;
        lastYardService = null;
        lastPicked = [];
      } else {
        var nextService = values.length === 1 ? values[0] : 'multiple-services';
        yardOwnsService = setService(nextService);
        lastYardService = yardOwnsService ? nextService : null;
        lastPicked = picked.slice();
      }
      renderAppliedYard();
    }
    cta.addEventListener('click', function () {
      if (service) applyYardSelection();
    });
    if (service) service.addEventListener('change', function () { if (!settingService) yardOwnsService = false; });
    var form = document.getElementById('contactForm');
    if (form) form.addEventListener('reset', function () {
      lastYardService = null;
      lastPicked = [];
      yardOwnsService = false;
      inputs.forEach(function (input) { input.checked = false; });
      sync();
      renderAppliedYard();
    });
    sync();
    // A selection made on /es/ can be carried into the main site's Spanish form.
    var transferred = new URLSearchParams(window.location.search).get('yard');
    if (transferred && service) {
      var requested = transferred.split(',');
      inputs.forEach(function (input) { input.checked = requested.indexOf(input.value) !== -1; });
      sync();
      applyYardSelection();
    }
    if (window.siteI18n && window.siteI18n.onChange) window.siteI18n.onChange(function () {
      window.setTimeout(function () {
        sync();
        renderAppliedYard();
      }, 0);
    });
  }

  /* ---------- Storm mode (owner switch) ---------- */
  function initStorm() {
    if (!window.fetch) return;
    fetch('/assets/data/site-status.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (status) {
        if (!status || status.storm !== true) return;
        var band = $('[data-storm-band]');
        if (!band) {
          var spanish = lang() === 'es';
          band = document.createElement('div');
          band.className = 'storm-band';
          band.setAttribute('data-storm-band', '');
          band.setAttribute('role', 'region');
          band.setAttribute('aria-label', spanish ? 'Aviso de tormenta' : 'Storm notice');
          var message = document.createElement('span');
          message.textContent = spanish ? '¿Daños por tormenta? Llame para consultar la disponibilidad' : 'Storm damage? Call about tree service availability';
          var call = document.createElement('a');
          call.className = 'storm-call';
          call.href = 'tel:18155011478';
          call.textContent = spanish ? 'Llama al (815) 501-1478' : 'Call (815) 501-1478';
          var help = document.createElement('a');
          help.href = spanish ? '/es/emergency-tree-removal/' : '/emergency-tree-removal/';
          help.textContent = spanish ? 'Ayuda de emergencia' : 'Emergency tree help';
          band.append(message, call, help);
          var pageHeader = $('body > header');
          if (pageHeader) pageHeader.after(band);
          else document.body.prepend(band);
        }
        var header = $('.site-header');
        if (header) {
          document.body.style.setProperty('--header-h', header.offsetHeight + 'px');
          document.body.classList.add('storm-header-offset');
        }
        band.hidden = false;
        document.body.classList.add('storm-on');
      })
      .catch(function () { /* stay quiet: the hero strip still offers the call */ });
  }

  function init() {
    initSeasonRing();
    initYard();
    initStorm();
  }
  // Deferred i18n initializes on DOMContentLoaded; let it set the requested
  // language before generating quote details or selecting a season panel.
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
