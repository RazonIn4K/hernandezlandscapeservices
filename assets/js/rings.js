/* Hernandez Landscape · "Growth Rings" behaviors (every page)
   - Hero rings grow once (reduced motion: drawn).
   - The Year in the Yard: a 12-month ring that opens on the current month in
     DeKalb County and shows what the crew does that season.
   - Walk your yard: tap zones on a property plan (or tick the list) and the
     quote form is prefilled with the matching service(s).
   - Storm mode: the owner flips assets/data/site-status.json {"storm": true}
     and a call-first band shows on every page. No response-time promises.
   Round 2 ("Living Seasons + Roots"):
   - Weather over [data-weather-hero] for today's season (same month logic
     and ?month= hook): fall leaves, winter snow + drift, spring petals +
     grass, summer fireflies. Decorative, paused off-screen/hidden tab,
     no particles for reduced motion.
   - "When we do this" [data-when] on service pages: marks today and writes
     the in-season / next-in-season chip. Months come from the markup.
   - Yard areas stamp into the quote form after "Add to my quote request".
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
    var lastYardService = null;
    var lastYardLine = null;

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
      // The Spanish landing page sends the selection to the bilingual quote form.
      if (!document.getElementById('contactService')) {
        var query = unique.length === 1 ? '&service=' + encodeURIComponent(unique[0]) :
          unique.length > 1 ? '&yard=' + encodeURIComponent(unique.join(',')) : '';
        cta.href = '/?lang=es' + query + '#quote';
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
      stamped = picked.slice();
      renderStamps(true);
      var values = picked.map(function (i) { return i.value; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var service = document.getElementById('contactService');
      var details = document.getElementById('projectDetails');
      if (details && lastYardLine && details.value.startsWith(lastYardLine)) {
        details.value = details.value.slice(lastYardLine.length).replace(/^\n/, '');
      }
      lastYardLine = null;
      if (values.length === 0 && service && service.value === lastYardService) {
        service.value = '';
        service.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (values.length < 2) {
        // main.js handles the single-service prefill on CTA clicks.
        lastYardService = values[0] || null;
        return;
      }
      if (service) {
        service.value = 'multiple-services';
        service.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (details) {
        var t = COPY[lang()] || COPY.en;
        var labels = picked.map(function (i) { var l = $('[data-yard-name]', i.closest('label')); return l ? l.textContent.trim() : i.value; });
        lastYardLine = t.notes + ': ' + labels.join(', ');
        details.value = lastYardLine + (details.value ? '\n' + details.value : '');
      }
      lastYardService = 'multiple-services';
    }
    cta.addEventListener('click', function () {
      if (document.getElementById('contactService')) applyYardSelection();
    });
    sync();
    // A selection made on /es/ can be carried into the main site's Spanish form.
    var transferred = new URLSearchParams(window.location.search).get('yard');
    if (transferred && document.getElementById('contactService')) {
      var requested = transferred.split(',');
      inputs.forEach(function (input) { input.checked = requested.indexOf(input.value) !== -1; });
      sync();
      applyYardSelection();
    }
    if (window.siteI18n && window.siteI18n.onChange) window.siteI18n.onChange(function () { window.setTimeout(function () { sync(); renderStamps(false); }, 0); });
  }

  /* ---------- Round 2 · Yard areas stamp into the quote form ---------- */
  var stamped = [];
  function renderStamps(animate) {
    var box = $('[data-yard-stamps]');
    var list = box && $('[data-yard-stamp-list]', box);
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    stamped.forEach(function (input, i) {
      var name = $('[data-yard-name]', input.closest('label'));
      var li = document.createElement('li');
      li.className = 'yard-stamp';
      li.textContent = name ? name.textContent.trim() : input.value;
      li.style.setProperty('--i', String(i));
      list.appendChild(li);
    });
    box.hidden = !stamped.length;
    if (!animate || reduce || !stamped.length) return;
    box.classList.remove('is-stamping');
    box.classList.add('is-pending');
    var go = function () { box.classList.remove('is-pending'); void box.offsetWidth; box.classList.add('is-stamping'); };
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      go();
    }, { threshold: 0.6 });
    io.observe(box);
  }

  /* ---------- Round 2 · The hero lives in the current season ----------
     Decorative SVG weather over the hero photo, built once. Deterministic
     positions (no RNG); paused off-screen and in hidden tabs; nothing moves
     for reduced motion (only the still ground edge is drawn). */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function vars(el, map) { Object.keys(map).forEach(function (k) { el.style.setProperty('--' + k, String(map[k])); }); }
  var SHAPES = {
    maple: 'M16 2L18.2 7.2 21 5.8 20 12 24.6 8.4 25.6 11 30 10.2 28.2 15 30.4 16.4 24.4 21 25.4 23.6 17 22.4 16.8 30H15.2L15 22.4 6.6 23.6 7.6 21 1.6 16.4 3.8 15 2 10.2 6.4 11 7.4 8.4 12 12 11 5.8 13.8 7.2Z',
    oak: 'M16 1.5C18.5 2 19.2 4.2 18.4 5.6C20.8 5 22.4 6.6 21 8.6C23.6 8.4 24.6 10.6 22.6 12.2C25.2 12.6 25.6 15.2 23 16.2C25 17.4 24.2 20 21.6 19.8C22.4 22 20.4 23.6 18.4 22.4L17 25.5 17.2 30.5H14.8L15 25.5 13.6 22.4C11.6 23.6 9.6 22 10.4 19.8C7.8 20 7 17.4 9 16.2C6.4 15.2 6.8 12.6 9.4 12.2C7.4 10.6 8.4 8.4 11 8.6C9.6 6.6 11.2 5 13.6 5.6C12.8 4.2 13.5 2 16 1.5Z',
    petal: 'M16 8.5L14.3 6C9.6 9 10.2 17.6 16 26.5C21.8 17.6 22.4 9 17.7 6Z'
  };
  var LEAF_COLORS = ['#b5532a', '#d99a2b', '#7f9a3a', '#c4692f', '#a8471f'];
  var PETAL_COLORS = ['#f6d3da', '#fbe8ec', '#f2c2cc', '#fff4f0'];
  /* x 0-1 across the free column, s size px, d fall seconds, o phase seconds,
     dx drift, t tumble seconds, r start angle, k shape/colour index */
  var LEAVES = [
    [0.08, 26, 13, 0.0, '70px', 3.4, -20, 0], [0.55, 21, 15, 2.1, '56px', 4.1, 35, 1],
    [0.30, 29, 12, 4.4, '84px', 3.0, 80, 2], [0.86, 19, 16, 6.2, '40px', 4.6, -60, 3],
    [0.18, 23, 14, 8.1, '64px', 3.7, 10, 4], [0.70, 27, 13, 9.9, '76px', 3.2, 120, 0],
    [0.42, 18, 17, 11.3, '48px', 4.8, -110, 1], [0.95, 24, 12, 3.3, '30px', 3.5, 60, 2],
    [0.62, 20, 15, 12.6, '58px', 4.3, -35, 3], [0.02, 22, 16, 5.6, '90px', 3.9, 150, 4]
  ];
  var PETALS = [
    [0.12, 20, 16, 0.0, '60px', 2.8, 10, 0], [0.48, 17, 18, 2.2, '48px', 3.3, -40, 1],
    [0.80, 19, 15, 4.5, '36px', 2.6, 70, 2], [0.30, 16, 19, 6.4, '66px', 3.6, -80, 3],
    [0.64, 18, 17, 8.1, '52px', 3.0, 30, 0], [0.94, 16, 16, 10.8, '28px', 2.9, -15, 1],
    [0.04, 18, 18, 12.9, '74px', 3.4, 100, 2], [0.56, 21, 15, 14.2, '40px', 3.1, -120, 3],
    [0.22, 17, 17, 3.6, '58px', 2.7, 45, 0], [0.88, 19, 19, 7.7, '34px', 3.5, -60, 2]
  ];
  var FLAKES = [];
  for (var fi = 0; fi < 26; fi++) {
    /* golden-ratio spacing gives an even, repeatable scatter */
    var fx = (fi * 0.618034) % 1;
    var near = fi % 3 === 0;
    FLAKES.push([fx, near ? 7 : (fi % 2 ? 5 : 4), near ? 11 + (fi % 4) : 15 + (fi % 5) * 1.3, (fi * 1.37) % 16, (near ? 46 : 26) + (fi % 4) * 6 + 'px', 0, 0, near ? 1 : 0]);
  }
  var FLIES = [
    [0.10, 30, 9, 0.0, '22px', 4.6, 0, 0.62], [0.52, 26, 11, 2.3, '-18px', 5.4, 0, 0.18],
    [0.86, 28, 10, 4.1, '16px', 4.2, 0, 0.84], [0.33, 24, 12, 1.2, '-24px', 6.1, 0, 0.40],
    [0.70, 30, 9.5, 3.4, '20px', 4.9, 0, 0.94], [0.20, 22, 11.5, 5.5, '-14px', 5.8, 0, 0.08],
    [0.96, 26, 10.5, 2.8, '-20px', 4.4, 0, 0.30], [0.44, 28, 10, 0.9, '18px', 5.1, 0, 0.76],
    [0.62, 24, 12.5, 4.8, '-16px', 4.7, 0, 0.50], [0.02, 26, 9, 3.9, '14px', 5.6, 0, 0.88]
  ];

  function particle(cls, p, draw) {
    var el = svg('svg', { class: 'wx-p ' + cls, viewBox: '0 0 32 32', preserveAspectRatio: 'xMidYMin meet', focusable: 'false', 'aria-hidden': 'true' });
    vars(el, { x: p[0], s: p[1], d: p[2], o: p[3], dx: p[4], t: p[5], r: p[6] });
    var g = svg('g', { class: 'wx-in' });
    draw(g, p);
    el.appendChild(g);
    return el;
  }
  function buildSky(season) {
    var sky = document.createElement('div');
    sky.className = 'wx-sky';
    sky.setAttribute('aria-hidden', 'true');
    if (season === 'fall') {
      LEAVES.forEach(function (p) {
        sky.appendChild(particle('wx-leaf', p, function (g) {
          g.appendChild(svg('path', { d: p[7] % 2 ? SHAPES.oak : SHAPES.maple, fill: LEAF_COLORS[p[7]] }));
          g.appendChild(svg('path', { d: 'M16 6V28', stroke: 'rgba(40,20,8,.35)', 'stroke-width': '0.9', fill: 'none' }));
        }));
      });
    } else if (season === 'spring') {
      PETALS.forEach(function (p) {
        sky.appendChild(particle('wx-petal', p, function (g) {
          g.appendChild(svg('path', { d: SHAPES.petal, fill: PETAL_COLORS[p[7]] }));
        }));
      });
    } else if (season === 'winter') {
      FLAKES.forEach(function (p) {
        var el = particle('wx-flake', p, function (g) {
          g.appendChild(svg('circle', { cx: '16', cy: '16', r: p[7] ? '13' : '11', fill: '#fff', 'fill-opacity': p[7] ? '0.92' : '0.7' }));
        });
        sky.appendChild(el);
      });
    } else {
      var defs = svg('svg', { width: '0', height: '0', class: 'wx-defs', focusable: 'false', 'aria-hidden': 'true' });
      var grad = svg('radialGradient', { id: 'wxGlow' });
      [['0', '#fff7b8', '1'], ['0.3', '#e8e46a', '0.55'], ['1', '#b8d98f', '0']].forEach(function (s) {
        grad.appendChild(svg('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }));
      });
      defs.appendChild(grad);
      sky.appendChild(defs);
      FLIES.forEach(function (p) {
        var el = particle('wx-fly', p, function (g) {
          g.appendChild(svg('circle', { cx: '16', cy: '16', r: '15', fill: 'url(#wxGlow)' }));
          g.appendChild(svg('circle', { cx: '16', cy: '16', r: '2.6', fill: '#fffbe0' }));
        });
        el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        vars(el, { y: p[7] });
        sky.appendChild(el);
      });
    }
    return sky;
  }
  var GRASS = {
    back: 'M2.6 40Q0.1 23.4 -2.9 9.7Q3.7 24.9 5.6 40ZM8.1 40Q9.2 22.4 12.4 8Q11.8 24 10.3 40ZM15.8 40Q18.4 20.7 24.7 4.8Q21.2 22.4 18.1 40ZM19.1 40Q20.1 22.4 24 8Q24.3 24 22.6 40ZM26.7 40Q26.1 30.8 26 23.2Q28.3 31.6 28.5 40ZM34 40Q34.2 29.5 36.3 20.9Q38 30.5 37.2 40ZM38.7 40Q39.7 24.8 43.6 12.3Q43.8 26.2 42.1 40ZM44 40Q45.3 24 49.6 11Q49.5 25.5 47.6 40ZM49.7 40Q50.3 21.4 53.4 6.3Q54.5 23.1 53.2 40ZM56.7 40Q55.9 30.7 55.7 23.1Q58.9 31.6 59.2 40ZM62.5 40Q65.6 22.1 72.5 7.5Q67.9 23.8 64.4 40ZM70.3 40Q73.2 21.3 80.3 6Q76.7 23 73.2 40ZM73.9 40Q73.6 28.9 74.1 19.7Q75.7 29.9 75.6 40ZM78.3 40Q77.4 24.6 77.2 12Q80.6 26 81 40ZM86 40Q88.5 22.8 95.1 8.7Q92.4 24.3 89.3 40ZM93.6 40Q96.8 22.9 104.7 8.9Q100.9 24.5 97 40ZM96.3 40Q98.9 25.5 105.5 13.7Q102.7 26.8 99.5 40ZM106.2 40Q104.9 31.3 103.4 24.3Q106.9 32.1 107.9 40ZM111.8 40Q113.6 22.1 118.8 7.5Q117.4 23.7 114.9 40ZM115.7 40Q119.4 20.7 128.1 4.9Q123.5 22.5 119.2 40Z',
    mid: 'M5.1 40Q4.3 29.5 4.5 20.8Q7.9 30.4 8.1 40ZM12.6 40Q11.3 29.6 11 21.1Q15.7 30.6 16.2 40ZM15.3 40Q13.5 27.5 12 17.2Q17.6 28.6 18.8 40ZM24.5 40Q22 25 18.8 12.8Q25 26.4 27 40ZM31.6 40Q29.6 27.4 27.9 17.2Q33.7 28.6 35 40ZM39.1 40Q37.8 29.1 36.7 20.3Q40.3 30.1 41.2 40ZM45.9 40Q43.4 29.8 40.1 21.4Q46.2 30.7 48.2 40ZM57.6 40Q57.4 32.7 58.1 26.8Q59.4 33.4 59.3 40ZM62.9 40Q60.8 29.6 58.9 21Q64.7 30.5 66.1 40ZM71.8 40Q69.8 30 67.6 21.8Q73.2 30.9 74.6 40ZM76.1 40Q74.1 27.4 71.9 17.1Q77.5 28.5 78.9 40ZM87.8 40Q84.9 27.4 80.7 17.2Q87.4 28.6 89.9 40ZM91.4 40Q90.1 34.5 89.1 30Q93.3 35 94.1 40ZM100.9 40Q101 33.2 102.7 27.7Q104 33.9 103.3 40ZM109.6 40Q107.3 30.6 104.9 23Q111.4 31.5 113.1 40ZM113.7 40Q114.2 28.9 117.2 19.8Q118.5 29.9 117.3 40Z',
    front: 'M5.9 40Q5.8 35.4 6.7 31.6Q8.1 35.8 7.8 40ZM13.7 40Q13.5 32.7 14.2 26.7Q16 33.4 15.9 40ZM24 40Q23.8 33.7 25.1 28.6Q27.2 34.3 26.8 40ZM32.9 40Q32.7 35.6 34.3 31.9Q36.8 36 36.3 40ZM42.7 40Q42.8 35.7 44.6 32.3Q46.5 36.1 45.8 40ZM57.9 40Q56.3 31.9 54.7 25.3Q59.5 32.6 60.6 40ZM63.4 40Q63.5 32.1 64.9 25.7Q66 32.8 65.5 40ZM71.6 40Q71.5 35.5 73.2 31.8Q75 35.9 74.5 40ZM80.2 40Q79.6 35.4 80.2 31.6Q83.1 35.8 83.2 40ZM91.7 40Q91.1 32.4 91.4 26.2Q94.1 33.1 94.2 40ZM101.8 40Q100.5 32.5 100.1 26.4Q104.9 33.2 105.5 40ZM110.6 40Q111.8 30.8 115.4 23.4Q114.8 31.7 113.1 40Z'
  };
  function buildGround(season) {
    if (season !== 'winter' && season !== 'spring') return null;
    var ground = document.createElement('div');
    ground.className = 'wx-ground';
    ground.setAttribute('aria-hidden', 'true');
    var s = svg('svg', { focusable: 'false', 'aria-hidden': 'true' });
    if (season === 'winter') {
      ground.className = 'wx-ground wx-drift';
      s.setAttribute('viewBox', '0 0 1440 48');
      s.setAttribute('preserveAspectRatio', 'none');
      var dg = svg('linearGradient', { id: 'wxDrift', x1: '0', y1: '0', x2: '0', y2: '1' });
      [['0', '#ffffff'], ['0.45', '#eef3f5'], ['1', '#f5f2e9']].forEach(function (st) { dg.appendChild(svg('stop', { offset: st[0], 'stop-color': st[1] })); });
      var dd = svg('defs');
      dd.appendChild(dg);
      s.appendChild(dd);
      s.appendChild(svg('path', { d: 'M0 48V20C80 12 150 9 240 9S380 18 470 17S600 11 660 14S760 26 800 26S900 15 980 13S1160 6 1260 7S1400 14 1440 15V48Z', fill: '#dfeaf0', 'fill-opacity': '0.5' }));
      s.appendChild(svg('path', { d: 'M0 48V26C70 20 130 14 200 14S330 24 420 24S520 18 560 18S660 34 720 34S820 24 880 22S930 18 960 18S1150 12 1220 12S1380 20 1440 22V48Z', fill: 'url(#wxDrift)' }));
      s.appendChild(svg('path', { d: 'M0 26C70 20 130 14 200 14S330 24 420 24S520 18 560 18S660 34 720 34S820 24 880 22S930 18 960 18S1150 12 1220 12S1380 20 1440 22', fill: 'none', stroke: '#b9cfdc', 'stroke-opacity': '0.6', 'stroke-width': '1.5', 'vector-effect': 'non-scaling-stroke' }));
    } else {
      var defs = svg('defs');
      [['wxGrassA', GRASS.back, '#3f6b2e', '0'], ['wxGrassB', GRASS.mid, '#6f9a3a', '37'], ['wxGrassC', GRASS.front, '#a7c865', '71']].forEach(function (row) {
        var pat = svg('pattern', { id: row[0], x: row[3], width: '120', height: '40', patternUnits: 'userSpaceOnUse' });
        pat.appendChild(svg('path', { d: row[1], fill: row[2] }));
        defs.appendChild(pat);
      });
      s.appendChild(defs);
      s.setAttribute('width', '100%');
      s.setAttribute('height', '40');
      [['wxGrassA', 'wx-grow wx-grow-1'], ['wxGrassB', 'wx-grow wx-grow-2'], ['wxGrassC', 'wx-grow wx-grow-3']].forEach(function (row) {
        var g = svg('g', { class: row[1] });
        g.appendChild(svg('rect', { width: '100%', height: '40', fill: 'url(#' + row[0] + ')' }));
        s.appendChild(g);
      });
    }
    ground.appendChild(s);
    return ground;
  }
  function initWeather() {
    var hero = $('[data-weather-hero]');
    if (!hero) return;
    var season = seasonOf(chicagoMonth());
    hero.setAttribute('data-weather', season);
    var ground = buildGround(season);
    if (ground) hero.appendChild(ground);
    if (reduce) return;
    var sky = buildSky(season);
    hero.appendChild(sky);
    var onScreen = true;
    var sync = function () {
      var paused = !onScreen || document.hidden;
      sky.classList.toggle('wx-paused', paused);
      if (ground) ground.classList.toggle('wx-paused', paused);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; sync(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
  }

  /* ---------- Round 2 · "When we do this" on service pages ----------
     Months come from the page markup (the SEASONS mapping, owner-pending);
     this only marks today and writes the chip. */
  function monthName(m) {
    try {
      return new Intl.DateTimeFormat(lang() === 'es' ? 'es' : 'en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m, 15)));
    } catch (e) { return ''; }
  }
  function initWhen() {
    $$('[data-when]').forEach(function (card) {
      var raw = card.getAttribute('data-when-months') || '';
      if (!/^(1[01]|[0-9])(,(1[01]|[0-9]))*$/.test(raw)) return;
      var on = raw.split(',').map(Number);
      var now = chicagoMonth();
      $$('.when-seg', card).forEach(function (seg, i) { seg.classList.toggle('is-now', i === now); });
      $$('.when-months li', card).forEach(function (li, i) { li.classList.toggle('is-now', i === now); });
      var chip = $('[data-when-chip]', card);
      if (!chip) return;
      var inSeason = on.indexOf(now) !== -1;
      var next = -1;
      for (var step = 1; step <= 12 && next === -1; step++) { if (on.indexOf((now + step) % 12) !== -1) next = (now + step) % 12; }
      var nowEl = $('[data-when-now]', chip);
      var nextEl = $('[data-when-next]', chip);
      var monthEl = $('[data-when-month]', chip);
      if (nowEl) nowEl.hidden = !inSeason;
      if (nextEl) nextEl.hidden = inSeason;
      if (monthEl) monthEl.textContent = !inSeason && next !== -1 ? monthName(next) : '';
      chip.classList.toggle('is-now', inSeason);
      chip.hidden = !inSeason && next === -1;
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
    initWeather();
    initSeasonRing();
    initYard();
    initWhen();
    initStorm();
  }
  // Deferred i18n initializes on DOMContentLoaded; let it set the requested
  // language before generating quote details or selecting a season panel.
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
