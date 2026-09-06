const modal = document.getElementById("customModal");
const modalContent = modal ? modal.querySelector(".modal-content") : null;
let lastFocusedElement = null;

function showModal(message, { showCall = false } = {}) {
  if (!modal || !modalContent) {
    console.warn("Modal elements unavailable.");
    return;
  }
  lastFocusedElement = document.activeElement;
  document.getElementById("modalMessage").textContent = message;
  const modalCallAction = document.getElementById("modalCallAction");
  if (modalCallAction) {
    modalCallAction.classList.toggle("hidden", !showCall);
  }
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  modalContent.setAttribute("tabindex", "-1");
  modalContent.focus();
}

function hideModal() {
  if (!modal || !modalContent) {
    return;
  }
  modal.classList.add("hidden");
  modal.style.display = "none";
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

if (modalContent) {
  modalContent.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ];
    const focusableElements = modalContent.querySelectorAll(
      focusableSelectors.join(","),
    );
    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    hideModal();
  }
});

const getSiteI18n = () => window.siteI18n || null;
const getMessage = (key, fallback) => {
  const siteI18n = getSiteI18n();
  if (siteI18n && typeof siteI18n.t === "function") {
    const value = siteI18n.t(key);
    if (value) {
      return value;
    }
  }
  return fallback;
};

const SERVICE_PREFILLS = {
  "lawn-care": {
    value: "lawn-care",
    labelKey: "quote.select.lawn",
    fallbackLabel: "Lawn Care",
  },
  "tree-service": {
    value: "tree-service",
    labelKey: "quote.select.tree",
    fallbackLabel: "Tree Service",
  },
  landscaping: {
    value: "landscaping",
    labelKey: "quote.select.landscaping",
    fallbackLabel: "Landscaping",
  },
  "snow-removal": {
    value: "snow-removal",
    labelKey: "quote.select.snow",
    fallbackLabel: "Snow Removal",
  },
  "leaf-removal": {
    value: "leaf-removal",
    labelKey: "quote.select.leaf",
    fallbackLabel: "Leaf Removal",
  },
  "gutter-cleaning": {
    value: "gutter-cleaning",
    labelKey: "quote.select.gutter",
    fallbackLabel: "Gutter Cleaning",
  },
  "pressure-washing": {
    value: "pressure-washing",
    labelKey: "quote.select.pressure",
    fallbackLabel: "Pressure Washing",
  },
};

const quotePrefillNotice = document.getElementById("quotePrefillNotice");
const quotePrefillText = document.getElementById("quotePrefillText");
let activePrefillService = null;

function renderQuotePrefillNotice(serviceKey) {
  if (!quotePrefillNotice || !quotePrefillText) {
    return;
  }

  const prefill = serviceKey ? SERVICE_PREFILLS[serviceKey] : null;
  if (!prefill) {
    quotePrefillText.textContent = "";
    quotePrefillNotice.classList.add("hidden");
    return;
  }

  const label = getMessage(prefill.labelKey, prefill.fallbackLabel);
  quotePrefillText.textContent = `${getMessage("quote.prefill.prefix", "Selected service:")} ${label}`;
  quotePrefillNotice.classList.remove("hidden");
}

function applyQuotePrefill(serviceKey) {
  const prefill = SERVICE_PREFILLS[serviceKey];
  const contactService = document.getElementById("contactService");

  if (!prefill || !contactService) {
    return false;
  }

  const optionExists = Array.from(contactService.options).some(
    (option) => option.value === prefill.value,
  );
  if (!optionExists) {
    return false;
  }

  contactService.value = prefill.value;
  contactService.classList.remove("border-red-500");
  activePrefillService = serviceKey;
  renderQuotePrefillNotice(serviceKey);
  return true;
}

function scrollElementBelowHeader(elementId) {
  const target = document.getElementById(elementId);
  if (!target) {
    return;
  }

  const header = document.getElementById("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.max(targetTop - headerHeight - 16, 0));
}

let activeScrollStabilizer = null;
let activeScrollStabilizerTimer = null;

function scheduleScrollElementBelowHeader(elementId) {
  const scrollToElement = () => scrollElementBelowHeader(elementId);

  window.requestAnimationFrame(scrollToElement);
  window.setTimeout(scrollToElement, 150);

  if ("ResizeObserver" in window && document.body) {
    if (activeScrollStabilizer) {
      activeScrollStabilizer.disconnect();
    }
    if (activeScrollStabilizerTimer) {
      window.clearTimeout(activeScrollStabilizerTimer);
    }
    activeScrollStabilizer = new ResizeObserver(scrollToElement);
    activeScrollStabilizer.observe(document.body);
    activeScrollStabilizerTimer = window.setTimeout(() => {
      activeScrollStabilizer?.disconnect();
      activeScrollStabilizer = null;
      activeScrollStabilizerTimer = null;
    }, 2500);
  }

  if (document.readyState === "complete") {
    window.setTimeout(scrollToElement, 350);
    return;
  }

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(scrollToElement, 0);
      window.setTimeout(scrollToElement, 350);
    },
    { once: true },
  );
}

document.querySelectorAll("[data-prefill-service]").forEach((link) => {
  link.addEventListener("click", () => {
    const serviceKey = link.getAttribute("data-prefill-service");
    if (serviceKey) {
      applyQuotePrefill(serviceKey);
    }
    if (link.hash === "#quote") {
      scheduleScrollElementBelowHeader("quote");
    }
  });
});

const requestedService = new URLSearchParams(window.location.search).get(
  "service",
);
if (requestedService) {
  const didApplyPrefill = applyQuotePrefill(requestedService);
  if (didApplyPrefill && window.location.hash === "#quote") {
    scheduleScrollElementBelowHeader("quote");
  }
}

const languageApi = getSiteI18n();
if (languageApi && typeof languageApi.onChange === "function") {
  languageApi.onChange(() => {
    renderQuotePrefillNotice(activePrefillService);
    if (activePrefillService && window.location.hash === "#quote") {
      scheduleScrollElementBelowHeader("quote");
    }
  });
}

window.addEventListener("scroll", function () {
  const header = document.getElementById("header");
  if (header) {
    header.classList.toggle("header-scrolled", window.scrollY > 100);
  }
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.classList.toggle("show", window.scrollY > 300);
  }
});

const mobileMenu = document.getElementById("mobileMenu");
const mobileMenuButton = document.getElementById("mobileMenuButton");

function setMobileMenuOpen(isOpen, { returnFocus = false } = {}) {
  if (!mobileMenu || !mobileMenuButton) {
    return;
  }

  mobileMenu.classList.toggle("hidden", !isOpen);
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  mobileMenuButton.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    mobileMenu.querySelector("a, button")?.focus();
  } else if (returnFocus) {
    mobileMenuButton.focus();
  }
}

function toggleMobileMenu() {
  const isOpen = mobileMenuButton?.getAttribute("aria-expanded") === "true";
  setMobileMenuOpen(!isOpen, { returnFocus: isOpen });
}

window.toggleMobileMenu = toggleMobileMenu;

if (mobileMenu && mobileMenuButton) {
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileMenuButton.addEventListener("click", toggleMobileMenu);
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenuOpen(false));
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenuButton.getAttribute("aria-expanded") === "true" &&
      !mobileMenu.contains(event.target) &&
      !mobileMenuButton.contains(event.target)
    ) {
      setMobileMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      mobileMenuButton.getAttribute("aria-expanded") === "true"
    ) {
      setMobileMenuOpen(false, { returnFocus: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      setMobileMenuOpen(false);
    }
  });
}

const slider = document.getElementById("beforeAfterSlider");
const handle = document.getElementById("sliderHandle");
if (slider && handle) {
  let isSliding = false;
  const afterImage = slider.querySelector(".after-image");

  const updateSlider = (percentage) => {
    if (!afterImage) {
      return;
    }
    const constrained = Math.max(0, Math.min(100, percentage));
    afterImage.style.clipPath = `polygon(${constrained}% 0, 100% 0, 100% 100%, ${constrained}% 100%)`;
    handle.style.left = `${constrained}%`;
    const rounded = Math.round(constrained);
    handle.setAttribute("aria-valuenow", String(rounded));
    handle.setAttribute(
      "aria-valuetext",
      getMessage(
        "gallery.slider.value",
        "Comparison divider at {{value}}%",
      ).replace("{{value}}", String(rounded)),
    );
  };

  handle.addEventListener("mousedown", () => {
    isSliding = true;
  });
  window.addEventListener("mouseup", () => {
    isSliding = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (!isSliding) return;
    const rect = slider.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    updateSlider(percentage);
  });

  handle.addEventListener(
    "touchstart",
    () => {
      isSliding = true;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchend",
    () => {
      isSliding = false;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (!isSliding) return;
      const rect = slider.getBoundingClientRect();
      const percentage =
        ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      updateSlider(percentage);
    },
    { passive: true },
  );

  handle.addEventListener("keydown", (event) => {
    const parsedValue = Number(handle.getAttribute("aria-valuenow"));
    const currentValue = Number.isFinite(parsedValue) ? parsedValue : 50;
    const keyActions = {
      ArrowLeft: currentValue - 5,
      ArrowDown: currentValue - 5,
      ArrowRight: currentValue + 5,
      ArrowUp: currentValue + 5,
      PageDown: currentValue - 10,
      PageUp: currentValue + 10,
      Home: 0,
      End: 100,
    };
    if (!(event.key in keyActions)) return;
    event.preventDefault();
    updateSlider(keyActions[event.key]);
  });

  updateSlider(50);
}

const quoteResult = document.getElementById("quoteResult");
let lastInstantEstimate = null;
// NOTE: do NOT add a "ccemail" field to the Web3Forms payload — it is a Pro-only
// feature and the API hard-rejects the whole submission with 400 on free tier
// (every lead bounced 2026-06-23 → 2026-07-08 because of this).
const SPAM_PHRASE_PATTERNS = [
  /ai agent/i,
  /ai implementation/i,
  /convert them/i,
  /getdandy/i,
  /google business profile/i,
  /schedule-a-chat/i,
  /trained it on/i,
  /unsubscribe/i,
  /15 minutes today or tomorrow/i,
];

function countUrls(value) {
  return (value.match(/https?:\/\/|www\./gi) || []).length;
}

/**
 * Classify a lead submission.
 * - "block": high-confidence bot signals (honeypot field or botcheck box) are
 *   never sent; the bot sees a fake success so it does not retry.
 * - "flag": timing and content heuristics are delivered with a warning so fast
 *   autofill, unusual real requests, and false-positive phrase matches are never
 *   silently lost. Provider-side controls should protect submission quota.
 * - "ok": clean lead, sent as-is.
 */
function classifyLeadSpam(formData) {
  const message = String(formData.get("message") || "");
  const email = String(formData.get("email") || "");
  const website = String(formData.get("website") || "");
  const botcheck = formData.get("botcheck");
  const formLoadedAt = Number(formData.get("form_loaded_at") || 0);
  const submittedTooFast =
    Number.isFinite(formLoadedAt) &&
    formLoadedAt > 0 &&
    Date.now() - formLoadedAt < 1500;

  if (website.trim() || botcheck) {
    return "block";
  }

  let spamScore = 0;
  if (submittedTooFast) spamScore += 2;
  if (countUrls(message) >= 3) spamScore += 2;
  else if (countUrls(message) === 2) spamScore += 1; // two links alone needs a second signal to trip
  if (/getdandy/i.test(email)) spamScore += 2;

  for (const pattern of SPAM_PHRASE_PATTERNS) {
    if (pattern.test(message)) spamScore += 1;
  }

  return spamScore >= 2 ? "flag" : "ok";
}

function handoffInstantEstimateToContactForm() {
  if (!lastInstantEstimate) {
    return false;
  }

  const propertyAddress = document.getElementById("propertyAddress");
  const isOwner = document.getElementById("isOwner");
  const instantBestTime = document.getElementById("instantBestTime");
  const instantName = document.getElementById("instantName");
  const instantPhone = document.getElementById("instantPhone");
  const contactAddress = document.getElementById("contactAddress");
  const ownerVerify = document.getElementById("ownerVerify");
  const contactBestTime = document.getElementById("bestTime");
  const projectDetails = document.getElementById("projectDetails");
  const contactName = document.getElementById("contactName");
  const contactPhone = document.getElementById("contactPhone");

  if (instantName?.value && contactName) {
    contactName.value = instantName.value.trim();
    contactName.classList.remove("border-red-500");
  }
  if (instantPhone?.value && contactPhone) {
    contactPhone.value = instantPhone.value.trim();
    contactPhone.classList.remove("border-red-500");
  }
  if (propertyAddress?.value && contactAddress) {
    contactAddress.value = propertyAddress.value;
    contactAddress.classList.remove("border-red-500");
  }
  if (isOwner && ownerVerify) {
    ownerVerify.checked = isOwner.checked;
  }
  if (instantBestTime?.value && contactBestTime) {
    contactBestTime.value = instantBestTime.value;
  }

  applyQuotePrefill(lastInstantEstimate.serviceValue);

  if (projectDetails) {
    const summary = `${getMessage("instant.handoff.prefix", "Instant estimate request:")} ${lastInstantEstimate.serviceLabel}, ${lastInstantEstimate.sizeLabel}, ZIP ${lastInstantEstimate.zip}. ${getMessage("instant.handoff.range", "Estimated range:")} ${lastInstantEstimate.priceText}.`;
    if (!projectDetails.value.includes(lastInstantEstimate.priceText)) {
      projectDetails.value = projectDetails.value
        ? `${projectDetails.value}\n\n${summary}`
        : summary;
    }
    projectDetails.classList.remove("border-red-500");
  }

  return true;
}

function calculateQuote() {
  const instantQuoteForm = document.getElementById("quoteForm");
  const service = document.getElementById("serviceType");
  const size = document.getElementById("propertySize");
  const zip = document.getElementById("zipCode");

  if (!service || !size || !zip) {
    console.warn("Quote form elements unavailable.");
    return;
  }

  if (!service.value || !size.value || !zip.value || !zip.checkValidity()) {
    const optionalDetails = size.closest("details");
    if (optionalDetails) {
      optionalDetails.open = true;
    }
    showModal(
      getMessage(
        "alerts.instant.missing",
        "Please select a service type, property size, and enter your ZIP code.",
      ),
    );
    service.classList.toggle("border-red-500", !service.value);
    size.classList.toggle("border-red-500", !size.value);
    zip.classList.toggle("border-red-500", !zip.value || !zip.checkValidity());
    return;
  }

  if (instantQuoteForm) {
    const name = document.getElementById("instantName");
    const phone = document.getElementById("instantPhone");
    const address = document.getElementById("propertyAddress");
    const owner = document.getElementById("isOwner");
    const coreInvalid =
      (name && !name.checkValidity()) ||
      (phone && !phone.checkValidity()) ||
      (address && !address.checkValidity()) ||
      (owner && !owner.checkValidity());
    if (coreInvalid) {
      instantQuoteForm.reportValidity();
      return;
    }
  }

  service.classList.remove("border-red-500");
  size.classList.remove("border-red-500");
  zip.classList.remove("border-red-500");

  const basePrices = {
    "lawn-care": { small: 40, medium: 60, large: 80, xlarge: 120 },
    "tree-service": { small: 200, medium: 350, large: 500, xlarge: 800 },
    landscaping: { small: 500, medium: 1000, large: 2000, xlarge: 3500 },
    "snow-removal": { small: 50, medium: 80, large: 120, xlarge: 200 },
    "leaf-removal": { small: 150, medium: 250, large: 400, xlarge: 600 },
    "gutter-cleaning": { small: 100, medium: 150, large: 225, xlarge: 325 },
    "pressure-washing": { small: 150, medium: 250, large: 400, xlarge: 650 },
    "multiple-services": { small: 250, medium: 500, large: 900, xlarge: 1500 },
  };

  const priceMap = basePrices[service.value];
  if (!priceMap) {
    showModal(
      getMessage("alerts.instant.missing", "Please select a valid service."),
    );
    return;
  }
  const basePrice = priceMap[size.value];
  if (!basePrice) {
    showModal(
      getMessage(
        "alerts.instant.missing",
        "Please select a valid property size.",
      ),
    );
    return;
  }

  const minPrice = Math.floor(basePrice * 0.8);
  const maxPrice = Math.floor(basePrice * 1.2);
  const priceText = `$${minPrice} - $${maxPrice}`;

  lastInstantEstimate = {
    serviceValue: service.value,
    serviceLabel:
      service.selectedOptions[0]?.textContent.trim() || service.value,
    sizeLabel: size.selectedOptions[0]?.textContent.trim() || size.value,
    zip: zip.value.trim(),
    priceText,
  };

  const priceRangeEl = document.getElementById("priceRange");
  if (priceRangeEl) {
    priceRangeEl.textContent = priceText;
  }
  if (quoteResult) {
    quoteResult.classList.remove("hidden");
  }

  handoffInstantEstimateToContactForm();
}

window.calculateQuote = calculateQuote;

const instantQuoteForm = document.getElementById("quoteForm");
if (instantQuoteForm) {
  instantQuoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateQuote();
  });
}

async function sendInstantEstimateRequest() {
  const instantName = document.getElementById("instantName");
  const instantPhone = document.getElementById("instantPhone");
  const propertyAddress = document.getElementById("propertyAddress");
  const service = document.getElementById("serviceType");
  const zip = document.getElementById("zipCode");
  const size = document.getElementById("propertySize");
  const instantBestTime = document.getElementById("instantBestTime");
  const isOwner = document.getElementById("isOwner");
  const sendBtn = document.getElementById("sendInstantRequestBtn");

  const missingCore =
    !instantName?.value?.trim() ||
    !instantPhone?.value?.trim() ||
    !instantPhone.checkValidity() ||
    !propertyAddress?.value?.trim() ||
    !service?.value ||
    !zip?.value?.trim() ||
    !zip.checkValidity() ||
    (isOwner && !isOwner.checked);

  if (missingCore) {
    document.getElementById("quoteForm")?.reportValidity();
    showModal(
      getMessage(
        "alerts.instant.sendMissing",
        "Please enter your name, mobile number, service, address, and ZIP code.",
      ),
    );
    return;
  }

  // Re-read the current choices if the customer edited them after calculating.
  lastInstantEstimate = null;
  if (service.value && size?.value && zip.value) {
    calculateQuote();
  } else if (!lastInstantEstimate) {
    lastInstantEstimate = {
      serviceValue: service.value,
      serviceLabel:
        service.selectedOptions[0]?.textContent.trim() || service.value,
      sizeLabel: size?.selectedOptions?.[0]?.textContent.trim() || "Not specified",
      zip: zip.value.trim(),
      priceText: "On-site estimate",
    };
  }

  handoffInstantEstimateToContactForm();

  const formData = new FormData();
  formData.set("access_key", "61e8b0ea-97d8-434c-8c2d-e54a44a63743");
  formData.set(
    "subject",
    "New Quote Request - Hernandez Landscape Services",
  );
  formData.set("from_name", "Website Instant Quote");
  formData.set("form_loaded_at", document.getElementById("formLoadedAt")?.value || String(Date.now()));
  formData.set("name", instantName.value.trim());
  formData.set("phone", instantPhone.value.trim());
  formData.set("email", "");
  formData.set("address", propertyAddress.value.trim());
  formData.set("service", service.value);
  formData.set("best_time", instantBestTime?.value || "");
  formData.set(
    "message",
    `${getMessage("instant.handoff.prefix", "Instant estimate request:")} ${lastInstantEstimate.serviceLabel}, ${lastInstantEstimate.sizeLabel}, ZIP ${lastInstantEstimate.zip}. ${getMessage("instant.handoff.range", "Estimated range:")} ${lastInstantEstimate.priceText}.`,
  );
  formData.set("botcheck", "");

  const originalText = sendBtn?.textContent || "";
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${getMessage("contact.sending", "Sending...")}`;
  }

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(result.message || "Submit failed");
    }
    showModal(
      getMessage(
        "alerts.instant.sendSuccess",
        "Thank you! Your estimate request was sent. Your appointment is not confirmed. Please wait for us to contact you.",
      ),
    );
    if (typeof window.hlsTrack === "function") {
      window.hlsTrack("quote_form_completion", { source: "instant_quote" });
    }
  } catch (error) {
    console.error(error);
    showModal(
      getMessage(
        "alerts.instant.sendError",
        "We could not send your request. Please call (815) 501-1478 or try again.",
      ),
    );
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = originalText;
    }
  }
}

const sendInstantRequestBtn = document.getElementById("sendInstantRequestBtn");
if (sendInstantRequestBtn) {
  sendInstantRequestBtn.addEventListener("click", () => {
    void sendInstantEstimateRequest();
  });
}

const sendEstimateBtn = document.getElementById("sendEstimateBtn");
if (sendEstimateBtn) {
  sendEstimateBtn.addEventListener("click", () => {
    if (!handoffInstantEstimateToContactForm()) {
      return;
    }

    const contactName = document.getElementById("contactName");
    if (contactName) {
      contactName.focus({ preventScroll: true });
    }
    scrollElementBelowHeader("quote");
    scheduleScrollElementBelowHeader("quote");
  });
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  const formLoadedAt = document.getElementById("formLoadedAt");
  if (formLoadedAt) {
    formLoadedAt.value = String(Date.now());
  }

  contactForm.addEventListener(
    "invalid",
    (event) => {
      event.target.setAttribute("aria-invalid", "true");
    },
    true,
  );
  ["input", "change"].forEach((eventName) => {
    contactForm.addEventListener(eventName, (event) => {
      if (event.target.validity?.valid) {
        event.target.removeAttribute("aria-invalid");
        event.target.classList.remove("border-red-500");
      }
    });
  });

  const contactService = document.getElementById("contactService");
  if (contactService) {
    contactService.addEventListener("change", () => {
      if (
        activePrefillService &&
        SERVICE_PREFILLS[activePrefillService]?.value === contactService.value
      ) {
        renderQuotePrefillNotice(activePrefillService);
        return;
      }

      activePrefillService = null;
      renderQuotePrefillNotice(null);
    });
  }

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const contactName = document.getElementById("contactName");
    const contactPhone = document.getElementById("contactPhone");
    const contactService = document.getElementById("contactService");
    const projectDetails = document.getElementById("projectDetails");

    let isValid = true;

    if (!contactName.value) {
      contactName.classList.add("border-red-500");
      isValid = false;
    } else {
      contactName.classList.remove("border-red-500");
    }
    if (!contactPhone.value || !contactPhone.checkValidity()) {
      contactPhone.classList.add("border-red-500");
      isValid = false;
    } else {
      contactPhone.classList.remove("border-red-500");
    }
    if (!contactService.value) {
      contactService.classList.add("border-red-500");
      isValid = false;
    } else {
      contactService.classList.remove("border-red-500");
    }
    if (!projectDetails.value) {
      projectDetails.classList.add("border-red-500");
      isValid = false;
    } else {
      projectDetails.classList.remove("border-red-500");
    }

    if (!isValid) {
      showModal(
        getMessage(
          "alerts.contact.invalid",
          "Please fill in all required fields correctly.",
        ),
      );
      return;
    }

    const button = this.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${getMessage("contact.sending", "Sending...")}`;
    }

    const formData = new FormData(this);
    formData.set("form_loaded_at", formLoadedAt?.value || String(Date.now()));

    const spamVerdict = classifyLeadSpam(formData);

    if (spamVerdict === "block") {
      showModal(
        getMessage(
          "alerts.contact.success",
          "Your estimate request was sent. Your appointment is not yet confirmed; our team will contact you about availability and timing.",
        ),
      );
      this.reset();
      if (formLoadedAt) {
        formLoadedAt.value = String(Date.now());
      }
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
      return;
    }

    if (spamVerdict === "flag") {
      const baseSubject = String(
        formData.get("subject") ||
          "New Quote Request - Hernandez Landscape Services",
      );
      formData.set("subject", `[Possible Spam] ${baseSubject}`);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    this.setAttribute("aria-busy", "true");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({ success: false }));

      if (response.ok && data.success === true) {
        if (typeof window.hlsTrack === "function") {
          window.hlsTrack("lead_submit_success", { source: "quote_form" });
        }
        showModal(
          getMessage(
            "alerts.contact.success",
            "Your estimate request was sent. Your appointment is not yet confirmed; our team will contact you about availability and timing.",
          ),
        );
        this.reset();
        if (formLoadedAt) {
          formLoadedAt.value = String(Date.now());
        }
      } else {
        showModal(
          getMessage(
            "alerts.contact.error",
            "There was an error sending your request. Please call us at 815-501-1478.",
          ),
          { showCall: true },
        );
      }
    } catch (error) {
      console.error(
        "Form submission failed:",
        error instanceof DOMException ? error.name : "request_error",
      );
      showModal(
        getMessage(
          "alerts.contact.error",
          "There was an error sending your request. Please call us at 815-501-1478.",
        ),
        { showCall: true },
      );
    } finally {
      window.clearTimeout(timeoutId);
      this.removeAttribute("aria-busy");
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
}

const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
}
