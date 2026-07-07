(function () {
  // GTM container id — intentionally empty until the owner creates a container
  // (see SEO_AUDIT_PLAN.md). While empty, NO third-party script loads and the
  // site makes zero extra requests; events still queue in window.dataLayer so
  // they flow into GTM the moment a real id is filled in and deployed.
  var GTM_CONTAINER_ID = ""; // e.g. "GTM-XXXXXXX"

  window.dataLayer = window.dataLayer || [];

  function track(event, params) {
    try {
      var payload = { event: event };
      var extra = params || {};
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) payload[key] = extra[key];
      }
      window.dataLayer.push(payload);
    } catch (e) {
      // Analytics must never break the page.
    }
  }
  window.hlsTrack = track;

  if (/^GTM-[A-Z0-9]+$/.test(GTM_CONTAINER_ID)) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_CONTAINER_ID;
    document.head.appendChild(script);
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
