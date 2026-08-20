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
  var COPY = {
    en: {
      locating: "Getting your location…",
      located: "Location attached (approximate accuracy: {meters} m).",
      locationFailed: "Couldn't get your location. Please check the address or ZIP above.",
      locationUnavailable: "Location sharing isn't available in this browser. You can use the address or ZIP above.",
      sent: "Request submitted.",
      receipt: "Your request is awaiting review and a callback. An appointment, arrival time and crew availability are not confirmed. You can call ",
      failed: "We couldn't confirm that your request was sent. Your information is still in the form. Please try again or call ",
      sending: "Sending…",
      validation: "Please complete the required fields and check the highlighted information.",
      required: "Please complete this field.",
      name: "Please enter a name between 2 and 100 characters.",
      phone: "Please enter a valid phone number.",
      location: "Please enter an address or ZIP within the field's length limit.",
      emergency_type: "Please choose a request type.",
      details: "Please shorten the details to fit the field's length limit.",
      invalid: "Please check this field."
    },
    es: {
      locating: "Obteniendo su ubicación…",
      located: "Ubicación adjunta (precisión aproximada: {meters} m).",
      locationFailed: "No pudimos obtener su ubicación. Revise la dirección o el código postal de arriba.",
      locationUnavailable: "Este navegador no permite compartir la ubicación. Puede usar la dirección o el código postal de arriba.",
      sent: "Solicitud enviada.",
      receipt: "Su solicitud está pendiente de revisión y de una llamada. La cita, la hora de llegada y la disponibilidad del equipo no están confirmadas. Puede llamar al ",
      failed: "No pudimos confirmar el envío de su solicitud. Sus datos siguen en el formulario. Intente de nuevo o llame al ",
      sending: "Enviando…",
      validation: "Complete los campos obligatorios y revise la información marcada.",
      required: "Complete este campo.",
      name: "Ingrese un nombre de entre 2 y 100 caracteres.",
      phone: "Ingrese un número de teléfono válido.",
      location: "Ingrese una dirección o un código postal dentro del límite de caracteres del campo.",
      emergency_type: "Seleccione un tipo de solicitud.",
      details: "Reduzca los detalles al límite de caracteres del campo.",
      invalid: "Revise este campo."
    }
  };

  function copy(key) {
    var lang = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
    return (COPY[lang] || COPY.en)[key];
  }

  function setGeoStatus(message) {
    if (geoStatus) geoStatus.textContent = message;
  }

  if (geoBtn && "geolocation" in navigator) {
    geoBtn.addEventListener("click", function () {
      setGeoStatus(copy("locating"));
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          if (latField) latField.value = String(pos.coords.latitude);
          if (lngField) lngField.value = String(pos.coords.longitude);
          if (accField) accField.value = String(Math.round(pos.coords.accuracy));
          setGeoStatus(
            copy("located").replace("{meters}", String(Math.round(pos.coords.accuracy)))
          );
        },
        function () {
          setGeoStatus(copy("locationFailed"));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  } else if (geoBtn) {
    geoBtn.disabled = true;
    setGeoStatus(copy("locationUnavailable"));
  }

  function showSuccess() {
    var panel = document.createElement("div");
    panel.className = "rounded-lg border border-green-200 bg-green-50 p-4 text-green-900";
    panel.setAttribute("role", "status");
    panel.innerHTML =
      '<p class="font-bold"><i class="fas fa-check-circle mr-2" aria-hidden="true"></i>' + copy("sent") + '</p>' +
      '<p class="mt-1 text-sm">' + copy("receipt") +
      '<a class="font-bold underline" href="' + PHONE_TEL + '">' + PHONE_DISPLAY + "</a>.</p>";
    form.replaceWith(panel);
  }

  function showError() {
    if (!dispatchStatus) return;
    dispatchStatus.setAttribute("role", "alert");
    dispatchStatus.innerHTML =
      copy("failed") + '<a class="font-bold underline" href="' +
      PHONE_TEL + '">' + PHONE_DISPLAY + "</a>.";
  }

  // Keep native constraints, with page-language feedback even when the
  // browser's own interface uses a different language. Clear custom errors
  // on edits so a corrected value can pass the same native validation.
  form.addEventListener("invalid", function (event) {
    var field = event.target;
    if (field && field.setCustomValidity) {
      field.setCustomValidity("");
      var key = field.validity && field.validity.valueMissing ? "required" : field.name;
      field.setCustomValidity(copy(key) || copy("invalid"));
    }
    if (dispatchStatus) {
      dispatchStatus.setAttribute("role", "alert");
      dispatchStatus.textContent = copy("validation");
    }
  }, true);

  function clearValidation(event) {
    if (event.target && event.target.setCustomValidity) {
      event.target.setCustomValidity("");
    }
  }
  form.addEventListener("input", clearValidation);
  form.addEventListener("change", clearValidation);

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
      button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ' + copy("sending");
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
