(function () {
  // Active Google Tag Manager container. Its tags and retention settings are
  // managed outside this repository; keep event payloads free of form fields
  // and other personally identifiable information.
  var GTM_CONTAINER_ID = "GTM-NJ4DPSC9";

  // Self-hosted Umami (runs in parallel with GTM). Both values stay empty until
  // the Cloud Run deployment exists; while empty, NO Umami script loads and the
  // site makes zero extra requests. Fill from `terraform output` after deploy:
  //   UMAMI_SRC        -> tracker_script_url (e.g. "https://umami-xxxx-uc.a.run.app/telemetry.js")
  //   UMAMI_WEBSITE_ID -> Umami dashboard -> Settings -> Websites -> Edit -> Website ID
  var UMAMI_SRC = "https://umami-amqlqzvkhq-uc.a.run.app/telemetry.js";
  var UMAMI_WEBSITE_ID = "a2ddbc37-4bb0-40ed-9792-50163676fa43";
  var UMAMI_DOMAINS = "hernandezlandscapeservices.com,www.hernandezlandscapeservices.com";

  window.dataLayer = window.dataLayer || [];

  // Codex review: GTM loads late (round 4), so a tracked click that leaves the page
  // before the container has loaded would be lost with the page. Such events are
  // kept here and, if the page goes away before GTM is ready, saved to
  // sessionStorage (this tab, this site only) and replayed on the next page.
  var QUEUE_KEY = "hls:pendingEvents";
  var QUEUE_MAX = 10;
  var QUEUE_MAX_CHARS = 4000;
  var QUEUE_TTL_MS = 2 * 60 * 1000;
  var VALUE_MAX = 200;
  // Only the site's own tracked events and parameters are ever replayed.
  var ALLOWED_EVENTS = {
    call_click: 1,
    quote_cta_click: 1,
    phone_click: 1,
    sms_click: 1,
    estimate_click: 1,
    quote_form_completion: 1,
    lead_submit_success: 1
  };
  var ALLOWED_PARAMS = { link_url: 1, source: 1 };
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };
  var pending = [];

  function gtmReady() {
    return Boolean(window.google_tag_manager && window.google_tag_manager[GTM_CONTAINER_ID]);
  }

  // Allowed event name, allowed keys, short strings and finite numbers; else null.
  function cleanEvent(name, params) {
    if (typeof name !== "string" || !own(ALLOWED_EVENTS, name)) return null;
    var out = {};
    if (params && typeof params === "object" && !Array.isArray(params)) {
      for (var key in params) {
        if (!own(params, key) || !own(ALLOWED_PARAMS, key)) continue;
        var value = params[key];
        if ((typeof value === "string" && value.length <= VALUE_MAX) || (typeof value === "number" && isFinite(value))) {
          out[key] = value;
        }
      }
    }
    return out;
  }

  function record(name, params, at) {
    var payload = { event: name };
    for (var key in params) {
      if (own(params, key)) payload[key] = params[key];
    }
    window.dataLayer.push(payload);
    if (!gtmReady()) {
      var clean = cleanEvent(name, params);
      if (clean) {
        pending.push({ event: name, params: clean, at: at, ref: payload });
        if (pending.length > QUEUE_MAX) pending.shift();
      }
    }
    return payload;
  }

  function track(event, params) {
    try {
      var extra = params || {};
      record(event, extra, Date.now());
      // Mirror the same event to Umami when its tracker has loaded.
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track(event, extra);
      }
    } catch (e) {
      // Analytics must never break the page.
    }
  }
  window.hlsTrack = track;

  if (/^GTM-[A-Z0-9]+$/i.test(GTM_CONTAINER_ID)) {
    // The queue starts now (page start time, and "gtm.js" stays the first event),
    // so clicks tracked before the container arrives are kept in order.
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    replayQueue();

    // Round 4 (research 03 R19): the container (and the Google tag it loads)
    // is fetched after the page has loaded and gone idle (at most ~3 s later),
    // or on the first scroll, pointer or key interaction, whichever comes first,
    // so it no longer competes with the first paint for bandwidth and CPU.
    var gtmRequested = false;
    var FIRST_INTERACTION = ["scroll", "pointerdown", "keydown", "touchstart"];
    var loadGtm = function () {
      if (gtmRequested) return;
      gtmRequested = true;
      FIRST_INTERACTION.forEach(function (type) {
        window.removeEventListener(type, loadGtm, true);
      });
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_CONTAINER_ID;
      document.head.appendChild(script);
    };
    FIRST_INTERACTION.forEach(function (type) {
      window.addEventListener(type, loadGtm, { capture: true, passive: true });
    });
    var whenIdle = function () {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(loadGtm, { timeout: 3000 });
      } else {
        window.setTimeout(loadGtm, 1500);
      }
    };
    if (document.readyState === "complete") {
      whenIdle();
    } else {
      window.addEventListener("load", whenIdle, { once: true });
    }
  }

  function replayQueue() {
    var raw = null;
    try {
      raw = window.sessionStorage.getItem(QUEUE_KEY);
      window.sessionStorage.removeItem(QUEUE_KEY);
    } catch (e) {
      return;
    }
    if (typeof raw !== "string" || raw.length > QUEUE_MAX_CHARS) return;
    var list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      return;
    }
    if (!Array.isArray(list)) return;
    var now = Date.now();
    list.slice(-QUEUE_MAX).forEach(function (item) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      var at = item.at;
      if (typeof at !== "number" || !isFinite(at) || at > now + 1000 || now - at > QUEUE_TTL_MS) return;
      var clean = cleanEvent(item.event, item.params);
      // Replayed through record(), so they carry on again if this page also
      // leaves before GTM loads (the age limit still applies).
      if (clean) record(item.event, clean, at);
    });
  }

  // The page is going away (a link, the call bar, a reload): if GTM never got
  // these events, keep them for the next page. Writing sessionStorage is
  // synchronous and small; navigation is not delayed.
  window.addEventListener("pagehide", function () {
    if (!pending.length || gtmReady()) return;
    try {
      window.sessionStorage.setItem(QUEUE_KEY, JSON.stringify(pending.map(function (p) {
        return { event: p.event, params: p.params, at: p.at };
      })));
    } catch (e) {
      return;
    }
    // If this page comes back from the back/forward cache, it must not send them too.
    pending.forEach(function (p) {
      var index = window.dataLayer.indexOf(p.ref);
      if (index !== -1) window.dataLayer.splice(index, 1);
    });
    pending = [];
  });

  if (UMAMI_SRC && UMAMI_WEBSITE_ID) {
    var umamiScript = document.createElement("script");
    umamiScript.defer = true;
    umamiScript.src = UMAMI_SRC;
    umamiScript.setAttribute("data-website-id", UMAMI_WEBSITE_ID);
    // Only count real visitor traffic, not localhost or preview hosts.
    umamiScript.setAttribute("data-domains", UMAMI_DOMAINS);
    document.head.appendChild(umamiScript);
  }

  // Auto-instrument the two highest-intent clicks: tap-to-call and the
  // "Get Free Quote" CTAs that jump to the estimate form.
  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a[href]") : null;
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (href.indexOf("tel:") === 0) {
        track("call_click", { link_url: href });
      } else if (href.indexOf("#quote") !== -1) {
        track("quote_cta_click", { link_url: href });
      }
    },
    true
  );
})();
