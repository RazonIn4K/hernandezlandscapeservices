const modal = document.getElementById("customModal");
const modalContent = modal ? modal.querySelector(".modal-content") : null;
let lastFocusedElement = null;

function showModal(message) {
  if (!modal || !modalContent) {
    console.warn("Modal elements unavailable.");
    return;
  }
  lastFocusedElement = document.activeElement;
  document.getElementById("modalMessage").textContent = message;
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
  window.scrollTo({
    top: Math.max(targetTop - headerHeight - 16, 0),
    behavior: "auto",
  });
}

function scheduleScrollElementBelowHeader(elementId) {
  const scrollToElement = () => scrollElementBelowHeader(elementId);

  window.requestAnimationFrame(scrollToElement);
  window.setTimeout(scrollToElement, 150);

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

function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const toggleButton = document.querySelector(
    'button[aria-controls="mobileMenu"]',
  );
  if (!menu || !toggleButton) {
    return;
  }
  const isHidden = menu.classList.toggle("hidden");
  toggleButton.setAttribute("aria-expanded", String(!isHidden));
  if (!isHidden) {
    const focusable = menu.querySelector("a, button");
    if (focusable) {
      focusable.focus();
    }
  } else {
    toggleButton.focus();
  }
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
    handle.setAttribute("aria-valuenow", String(Math.round(constrained)));
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
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentValue = Number(handle.getAttribute("aria-valuenow")) || 50;
      const delta = event.key === "ArrowLeft" ? -5 : 5;
      updateSlider(currentValue + delta);
    }
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
 * - "block": bot signals (honeypot field, botcheck box, or an inhumanly fast
 *   submit) — never sent, bot sees a fake success so it does not retry.
 * - "flag": borderline content heuristics (score 2-3: URL count, spam phrases)
 *   — still sent to Web3Forms with a "[Possible Spam]" subject tag so a
 *   borderline real lead is never silently dropped.
 * - "block" (score >= 4): multiple strong content signals stacked — high enough
 *   confidence to hard-block so a spam campaign cannot drain the Web3Forms
 *   submission quota that real leads depend on.
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

  if (website.trim() || botcheck || submittedTooFast) {
    return "block";
  }

  let spamScore = 0;
  if (countUrls(message) >= 3) spamScore += 2;
  else if (countUrls(message) === 2) spamScore += 1; // two links alone needs a second signal to trip
  if (/getdandy/i.test(email)) spamScore += 2;

  for (const pattern of SPAM_PHRASE_PATTERNS) {
    if (pattern.test(message)) spamScore += 1;
  }

  if (spamScore >= 4) return "block";
  return spamScore >= 2 ? "flag" : "ok";
}

function calculateQuote() {
  const service = document.getElementById("serviceType");
  const size = document.getElementById("propertySize");
  const zip = document.getElementById("zipCode");

  if (!service || !size || !zip) {
    console.warn("Quote form elements unavailable.");
    return;
  }

  if (!service.value || !size.value || !zip.value || !zip.checkValidity()) {
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
}

window.calculateQuote = calculateQuote;

const calculateQuoteBtn = document.getElementById("calculateQuoteBtn");
if (calculateQuoteBtn) {
  calculateQuoteBtn.addEventListener("click", calculateQuote);
}

const sendEstimateBtn = document.getElementById("sendEstimateBtn");
if (sendEstimateBtn) {
  sendEstimateBtn.addEventListener("click", () => {
    if (!lastInstantEstimate) {
      return;
    }

    const propertyAddress = document.getElementById("propertyAddress");
    const isOwner = document.getElementById("isOwner");
    const instantBestTime = document.getElementById("instantBestTime");
    const contactAddress = document.getElementById("contactAddress");
    const ownerVerify = document.getElementById("ownerVerify");
    const contactBestTime = document.getElementById("bestTime");
    const projectDetails = document.getElementById("projectDetails");

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
      projectDetails.value = projectDetails.value
        ? `${projectDetails.value}\n\n${summary}`
        : summary;
      projectDetails.classList.remove("border-red-500");
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
          "Thank you for your interest! We will call you within 24 hours.",
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

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (typeof window.hlsTrack === "function") {
          window.hlsTrack("lead_submit_success", { source: "quote_form" });
        }
        // Instant owner Telegram alert, on top of the Web3Forms email above.
        // Fire-and-forget + production host only, so tests/localhost never ping.
        try {
          if (location.hostname.endsWith("hernandezlandscapeservices.com")) {
            fetch("https://34-172-247-12.sslip.io/webhook/website-lead", {
              method: "POST",
              keepalive: true,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: "wlk7Rp2mX9qV4tB8nZ6yHsDc3F",
                site: "hernandezlandscapeservices.com",
                name: String(formData.get("name") || ""),
                phone: String(formData.get("phone") || ""),
                email: String(formData.get("email") || ""),
                service: String(formData.get("service") || ""),
                message: String(formData.get("message") || ""),
                sourceUrl: "quote_form"
              })
            }).catch(function () {});
          }
        } catch (e) {
          /* best-effort */
        }
        showModal(
          getMessage(
            "alerts.contact.success",
            "Thank you for your interest! We will call you within 24 hours.",
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
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showModal(
        getMessage(
          "alerts.contact.error",
          "There was an error sending your request. Please call us at 815-501-1478.",
        ),
      );
    } finally {
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
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// Scroll reveal animations using Intersection Observer
const revealElements = document.querySelectorAll(
  ".reveal, .reveal-left, .reveal-right",
);
if (revealElements.length > 0 && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  // Fallback for browsers without IntersectionObserver
  revealElements.forEach((el) => el.classList.add("active"));
}
