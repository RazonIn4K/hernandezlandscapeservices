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

  function track(event, params) {
    try {
      var payload = { event: event };
      var extra = params || {};
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) payload[key] = extra[key];
      }
      window.dataLayer.push(payload);
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
