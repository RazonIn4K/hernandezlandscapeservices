/**
 * Emergency dispatch form enhancement (SEO_AUDIT_PLAN Phase 3).
 *
 * Progressive enhancement for form[data-emergency-dispatch]:
 *  - Captures geolocation (only on an explicit button click, never on load)
 *    or falls back to the typed address/ZIP.
 *  - If the form's data-endpoint is set (the deployed /api/emergency-dispatch
 *    worker, see functions/emergency-dispatch.mjs), submits a structured JSON
 *    payload there so n8n can compute drive time and page the owner.
 *  - If the endpoint is unset or unreachable, falls back to the existing
 *    Web3Forms email path (the form's native action), so the CTA works today.
 *  - No JS at all? The form still POSTs natively to Web3Forms.
 */
(function () {
  "use strict";

  var form = document.querySelector("form[data-emergency-dispatch]");
  if (!form) return;

  var geoBtn = form.querySelector("[data-geo-request]");
  var geoStatus = form.querySelector("[data-geo-status]");
  var dispatchStatus = form.querySelector("[data-dispatch-status]");
  var latField = form.querySelector('input[name="geo_lat"]');
  var lngField = form.querySelector('input[name="geo_lng"]');
  var accField = form.querySelector('input[name="geo_accuracy"]');

  var PHONE_DISPLAY = "(815) 501-1478";
  var PHONE_TEL = "tel:18155011478";
  var ZIP_RE = /^\d{5}(-\d{4})?$/;
  var REQUEST_TIMEOUT_MS = 12000;

  function setGeoStatus(message) {
    if (geoStatus) geoStatus.textContent = message;
  }

  if (geoBtn && "geolocation" in navigator) {
    geoBtn.addEventListener("click", function () {
      setGeoStatus("Getting your location…");
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          if (latField) latField.value = String(pos.coords.latitude);
          if (lngField) lngField.value = String(pos.coords.longitude);
          if (accField) accField.value = String(Math.round(pos.coords.accuracy));
          setGeoStatus(
            "Location attached (within ~" + Math.round(pos.coords.accuracy) + " m)."
          );
        },
        function () {
          setGeoStatus("Couldn't get your location — please make sure the address or ZIP above is right.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  } else if (geoBtn) {
    geoBtn.disabled = true;
    setGeoStatus("Location sharing isn't available in this browser — the address or ZIP above is enough.");
  }

  function showSuccess() {
    var panel = document.createElement("div");
    panel.className = "rounded-lg border border-green-200 bg-green-50 p-4 text-green-900";
    panel.setAttribute("role", "status");
    panel.innerHTML =
      '<p class="font-bold"><i class="fas fa-check-circle mr-2" aria-hidden="true"></i>Emergency request sent.</p>' +
      '<p class="mt-1 text-sm">The team has been notified. If you don’t hear back within a few minutes, please call ' +
      '<a class="font-bold underline" href="' + PHONE_TEL + '">' + PHONE_DISPLAY + "</a>.</p>";
    form.replaceWith(panel);
  }

  function showError() {
    if (!dispatchStatus) return;
    dispatchStatus.setAttribute("role", "alert");
    dispatchStatus.innerHTML =
      'Something went wrong sending your request. Please call <a class="font-bold underline" href="' +
      PHONE_TEL + '">' + PHONE_DISPLAY + "</a> — emergencies are answered 24/7.";
  }

  function fetchWithTimeout(url, options) {
    var controller = new AbortController();
    var timeout = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .finally(function () {
        window.clearTimeout(timeout);
      });
  }

  function buildPayload() {
    var locationRaw = (form.querySelector('input[name="location"]') || {}).value || "";
    locationRaw = locationRaw.trim();
    var payload = {
      name: (form.querySelector('input[name="name"]') || {}).value || "",
      phone: (form.querySelector('input[name="phone"]') || {}).value || "",
      emergencyType: (form.querySelector('select[name="emergency_type"]') || {}).value || "",
      details: (form.querySelector('textarea[name="details"]') || {}).value || "",
      website: (form.querySelector('input[name="website"]') || {}).value || "",
      page: window.location.pathname
    };
    if (ZIP_RE.test(locationRaw)) {
      payload.zip = locationRaw;
    } else if (locationRaw) {
      payload.address = locationRaw;
    }
    var lat = parseFloat(latField && latField.value);
    var lng = parseFloat(lngField && lngField.value);
    if (isFinite(lat) && isFinite(lng)) {
      payload.geo = { lat: lat, lng: lng };
      var acc = parseFloat(accField && accField.value);
      if (isFinite(acc)) payload.geo.accuracyM = acc;
    }
    return payload;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      if (form.reportValidity) form.reportValidity();
      return;
    }

    var honeypotFilled =
      ((form.querySelector('input[name="website"]') || {}).value || "").trim() !== "" ||
      (form.querySelector('input[name="botcheck"]') || {}).checked;
    if (honeypotFilled) {
      showSuccess(); // convincing success, nothing sent
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    var originalText = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    }
    form.setAttribute("aria-busy", "true");
    if (dispatchStatus) {
      dispatchStatus.removeAttribute("role");
      dispatchStatus.textContent = "";
    }

    var endpoint = form.getAttribute("data-endpoint");

    function restoreButton() {
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = originalText;
      }
      form.removeAttribute("aria-busy");
    }

    function web3formsFallback() {
      var formData = new FormData(form);
      return fetchWithTimeout("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (error) {
              data = null;
            }
            if (!res.ok || !data) {
              throw new Error("Web3Forms rejected the emergency request");
            }
            return data;
          });
        })
        .then(function (data) {
          if (data.success) {
            showSuccess();
          } else {
            restoreButton();
            showError();
          }
        })
        .catch(function () {
          restoreButton();
          showError();
        });
    }

    if (endpoint) {
      fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload())
      })
        .then(function (res) {
          if (res.ok) {
            showSuccess();
          } else {
            // Endpoint rejected or down — don't lose an emergency lead.
            return web3formsFallback();
          }
        })
        .catch(function () {
          return web3formsFallback();
        });
    } else {
      web3formsFallback();
    }
  });
})();
