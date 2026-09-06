(() => {
  const PHONE_DISPLAY = "(815) 501-1478";
  const PHONE_HREF = "tel:18155011478";
  const SMS_HREF = "sms:+18155011478";
  const STYLE_ID = "mobile-call-cta-style";

  const styles = `
    .mobile-call-cta {
      display: none;
    }

    @media (max-width: 767px) {
      .mobile-call-cta {
        align-items: stretch;
        background: #0f2f24;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 1rem;
        bottom: calc(10px + env(safe-area-inset-bottom));
        box-shadow: 0 16px 36px rgba(10, 38, 28, 0.4);
        color: #fff;
        display: grid;
        font-family: "Montserrat", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        gap: 0.4rem;
        grid-template-columns: 1.2fr 0.9fr 1.1fr;
        left: max(10px, env(safe-area-inset-left));
        min-height: 56px;
        opacity: 0;
        padding: 0.4rem;
        pointer-events: none;
        position: fixed;
        right: max(10px, env(safe-area-inset-right));
        transform: translateY(calc(100% + 28px));
        visibility: hidden;
        z-index: 1000;
      }

      .mobile-call-cta.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
        visibility: visible;
      }

      .mobile-call-cta__btn {
        align-items: center;
        border-radius: 0.75rem;
        color: #fff;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 800;
        justify-content: center;
        letter-spacing: 0.01em;
        line-height: 1.15;
        min-height: 48px;
        padding: 0.55rem 0.35rem;
        text-align: center;
        text-decoration: none;
      }

      .mobile-call-cta__btn--call {
        background: #166534;
      }

      .mobile-call-cta__btn--call.is-emergency {
        background: #b45309;
      }

      .mobile-call-cta__btn--text {
        background: #1f4d3c;
      }

      .mobile-call-cta__btn--estimate {
        background: #14532d;
        border: 1px solid rgba(255, 255, 255, 0.28);
      }

      .mobile-call-cta__btn:hover,
      .mobile-call-cta__btn:active {
        filter: brightness(1.06);
        text-decoration: none;
      }

      .mobile-call-cta__btn:focus-visible {
        outline: 3px solid #facc15;
        outline-offset: 2px;
      }
    }

    @media (max-width: 360px) {
      .mobile-call-cta {
        grid-template-columns: 1fr 1fr 1fr;
      }

      .mobile-call-cta__btn {
        font-size: 0.72rem;
        padding-inline: 0.2rem;
      }
    }

    @media (max-width: 767px) and (max-height: 500px) and (orientation: landscape) {
      .mobile-call-cta {
        display: none !important;
      }
    }

    @media (prefers-reduced-motion: no-preference) and (max-width: 767px) {
      .mobile-call-cta {
        transition:
          opacity 180ms ease,
          transform 180ms ease,
          visibility 180ms ease;
      }
    }

    @media print {
      .mobile-call-cta {
        display: none !important;
      }
    }
  `;

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles;
    document.head.append(style);
  };

  const isEmergencyPage = () => {
    if (document.body?.dataset?.mobileCta === "emergency") return true;
    return /\/(tree-removal|emergency-tree-removal)(\/|$)/.test(
      window.location.pathname,
    );
  };

  const estimateHref = () => {
    const quote = document.getElementById("quote") || document.getElementById("instant-quote");
    const isHomepage = window.location.pathname === "/" || window.location.pathname === "/index.html";
    if (isHomepage && quote) return "#quote";
    if (document.documentElement.lang.toLowerCase().startsWith("es")) {
      return "/?lang=es#quote";
    }
    return "/#quote";
  };

  const appendCallButton = () => {
    if (document.querySelector("[data-mobile-call-cta]")) return;

    injectStyles();

    const emergency = isEmergencyPage();
    const bar = document.createElement("nav");
    bar.className = "mobile-call-cta";
    bar.dataset.mobileCallCta = "true";
    bar.dataset.layoutIgnore = "fixed-cta";
    bar.setAttribute(
      "aria-label",
      emergency
        ? "Emergency contact options"
        : "Quick contact options",
    );

    const callLabel = emergency ? "Emergency Call" : "Call Now";
    const callAria = emergency
      ? `Emergency call Hernandez Landscape at ${PHONE_DISPLAY}`
      : `Call Hernandez Landscape now at ${PHONE_DISPLAY}`;

    bar.innerHTML = `
      <a class="mobile-call-cta__btn mobile-call-cta__btn--call${emergency ? " is-emergency" : ""}" href="${PHONE_HREF}" data-mobile-call-cta-call="true" aria-label="${callAria}">${callLabel}</a>
      <a class="mobile-call-cta__btn mobile-call-cta__btn--text" href="${SMS_HREF}" data-mobile-call-cta-text="true" aria-label="Text Hernandez Landscape at ${PHONE_DISPLAY}">Text</a>
      <a class="mobile-call-cta__btn mobile-call-cta__btn--estimate" href="${estimateHref()}" data-mobile-call-cta-estimate="true" aria-label="Request a free estimate">Free Estimate</a>
    `;

    document.body.append(bar);

    const updateLanguage = () => {
      const spanish = document.documentElement.lang.toLowerCase().startsWith("es");
      const call = bar.querySelector("[data-mobile-call-cta-call]");
      const text = bar.querySelector("[data-mobile-call-cta-text]");
      const estimate = bar.querySelector("[data-mobile-call-cta-estimate]");

      bar.setAttribute("aria-label", spanish
        ? (emergency ? "Opciones de contacto de emergencia" : "Opciones de contacto rápido")
        : (emergency ? "Emergency contact options" : "Quick contact options"));
      call.textContent = spanish
        ? (emergency ? "Emergencia" : "Llamar ahora")
        : callLabel;
      call.setAttribute("aria-label", spanish
        ? (emergency
          ? `Llamar a Hernandez Landscape por una emergencia al ${PHONE_DISPLAY}`
          : `Llamar a Hernandez Landscape al ${PHONE_DISPLAY}`)
        : callAria);
      text.textContent = spanish ? "Mensaje" : "Text";
      text.setAttribute("aria-label", spanish
        ? `Enviar un mensaje a Hernandez Landscape al ${PHONE_DISPLAY}`
        : `Text Hernandez Landscape at ${PHONE_DISPLAY}`);
      estimate.textContent = spanish ? "Cotización gratis" : "Free Estimate";
      estimate.setAttribute("aria-label", spanish
        ? "Solicitar una cotización gratis"
        : "Request a free estimate");
      estimate.setAttribute("href", estimateHref());
    };

    updateLanguage();
    new MutationObserver(updateLanguage).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    const hero = document.querySelector(".site-hero");
    const quote =
      document.getElementById("quote") ||
      document.getElementById("instant-quote") ||
      document.getElementById("cotizacion");
    const footer = document.querySelector("footer");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const shortLandscapeQuery = window.matchMedia(
      "(max-height: 500px) and (orientation: landscape)",
    );

    const overlapsViewport = (element, inset = 0) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > inset && rect.top < window.innerHeight - inset;
    };

    const updateVisibility = () => {
      const heroIsVisible = overlapsViewport(hero, 80);
      const conversionAreaIsVisible =
        overlapsViewport(quote, 80) || overlapsViewport(footer, 32);
      const shouldShow =
        mobileQuery.matches &&
        !shortLandscapeQuery.matches &&
        !heroIsVisible &&
        !conversionAreaIsVisible;

      bar.classList.toggle("is-visible", shouldShow);
      document.body.classList.toggle("has-mobile-cta", shouldShow);
    };

    const observedSections = [hero, quote, footer].filter(Boolean);
    if ("IntersectionObserver" in window && observedSections.length) {
      const observer = new IntersectionObserver(updateVisibility, {
        threshold: [0, 0.05, 0.5, 1],
        rootMargin: "-32px 0px -32px",
      });
      observedSections.forEach((section) => observer.observe(section));
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility, { passive: true });
    mobileQuery.addEventListener?.("change", updateVisibility);
    shortLandscapeQuery.addEventListener?.("change", updateVisibility);

    bar.querySelector("[data-mobile-call-cta-call]")?.addEventListener("click", () => {
      if (typeof window.hlsTrack === "function") {
        window.hlsTrack("phone_click", {
          source: emergency ? "mobile_sticky_emergency" : "mobile_sticky_cta",
        });
      }
    });
    bar.querySelector("[data-mobile-call-cta-text]")?.addEventListener("click", () => {
      if (typeof window.hlsTrack === "function") {
        window.hlsTrack("sms_click", { source: "mobile_sticky_cta" });
      }
    });
    bar.querySelector("[data-mobile-call-cta-estimate]")?.addEventListener("click", () => {
      if (typeof window.hlsTrack === "function") {
        window.hlsTrack("estimate_click", { source: "mobile_sticky_cta" });
      }
    });

    updateVisibility();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", appendCallButton, {
      once: true,
    });
  } else {
    appendCallButton();
  }
})();
