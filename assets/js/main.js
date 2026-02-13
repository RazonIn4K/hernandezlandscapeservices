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

const siteI18n = window.siteI18n || null;
const getMessage = (key, fallback) => {
  if (siteI18n && typeof siteI18n.t === "function") {
    const value = siteI18n.t(key);
    if (value) {
      return value;
    }
  }
  return fallback;
};

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

let currentTestimonial = 0;
const testimonialTrack = document.getElementById("testimonialTrack");
const testimonialDots = document.querySelectorAll(
  ".flex.justify-center.mt-6 button",
);
const totalTestimonials = testimonialDots.length;

function goToTestimonial(index) {
  if (!testimonialTrack || !testimonialDots.length) {
    return;
  }
  currentTestimonial = index;
  testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
  testimonialDots.forEach((dot, i) => {
    dot.className =
      i === index
        ? "w-3 h-3 bg-green-600 rounded-full"
        : "w-3 h-3 bg-gray-300 rounded-full";
  });
}

if (testimonialTrack && testimonialDots.length) {
  setInterval(() => {
    goToTestimonial((currentTestimonial + 1) % totalTestimonials);
  }, 5000);
}

const quoteResult = document.getElementById("quoteResult");

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
    lawn: { small: 40, medium: 60, large: 80, xlarge: 120 },
    tree: { small: 200, medium: 350, large: 500, xlarge: 800 },
    landscaping: { small: 500, medium: 1000, large: 2000, xlarge: 3500 },
    cleanup: { small: 150, medium: 250, large: 400, xlarge: 600 },
    snow: { small: 50, medium: 80, large: 120, xlarge: 200 },
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

  const priceRangeEl = document.getElementById("priceRange");
  if (priceRangeEl) {
    priceRangeEl.textContent = `$${minPrice} - $${maxPrice}`;
  }
  if (quoteResult) {
    quoteResult.classList.remove("hidden");
  }
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
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

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showModal(
          getMessage(
            "alerts.contact.success",
            "Thank you for your interest! We will call you within 24 hours.",
          ),
        );
        this.reset();
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
