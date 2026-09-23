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
    en: { none: 'Nothing selected yet', one: '1 area selected', many: '{n} areas selected', notes: 'Yard areas' },
    es: { none: 'Nada seleccionado', one: '1 área seleccionada', many: '{n} áreas seleccionadas', notes: 'Áreas del jardín' }
  };
  function initYard() {
    var box = $('[data-yard]');
    if (!box) return;
    var inputs = $$('input[name="yard-zone"]', box);
    var zones = $$('.zone[data-zone]', box);
    var count = $('[data-yard-count]', box);
    var cta = $('[data-yard-cta]', box);

    function chosen() { return inputs.filter(function (i) { return i.checked; }); }
    function sync() {
      var picked = chosen();
      var values = picked.map(function (i) { return i.value; });
      zones.forEach(function (z) { z.classList.toggle('is-on', values.indexOf(z.getAttribute('data-zone')) !== -1); });
      var t = COPY[lang()] || COPY.en;
      if (count) count.textContent = !picked.length ? t.none : picked.length === 1 ? t.one : t.many.replace('{n}', picked.length);
      var unique = values.filter(function (v, i) { return values.indexOf(v) === i; });
      if (unique.length === 1) cta.setAttribute('data-prefill-service', unique[0]);
      else cta.removeAttribute('data-prefill-service');
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
    cta.addEventListener('click', function () {
      var picked = chosen();
      var values = picked.map(function (i) { return i.value; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (values.length < 2) return; // single service: main.js applies data-prefill-service
      var service = document.getElementById('contactService');
      var details = document.getElementById('projectDetails');
      if (service) {
        service.value = 'multiple-services';
        service.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (details) {
        var t = COPY[lang()] || COPY.en;
        var labels = picked.map(function (i) { var l = $('[data-yard-name]', i.closest('label')); return l ? l.textContent.trim() : i.value; });
        var line = t.notes + ': ' + labels.join(', ');
        var existing = details.value.replace(/^(Yard areas|Áreas del jardín): .*\n?/, '');
        details.value = line + (existing ? '\n' + existing : '');
      }
    });
    sync();
    if (window.siteI18n && window.siteI18n.onChange) window.siteI18n.onChange(function () { window.setTimeout(sync, 0); });
  }

  /* ---------- Storm mode (owner switch) ---------- */
  function initStorm() {
    var band = $('[data-storm-band]');
    if (!band || !window.fetch) return;
    fetch('/assets/data/site-status.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (status) {
        if (!status || status.storm !== true) return;
        var header = $('.site-header');
        if (header) document.body.style.setProperty('--header-h', header.offsetHeight + 'px');
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
