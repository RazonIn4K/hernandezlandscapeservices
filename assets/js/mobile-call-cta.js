(() => {
  const PHONE_DISPLAY = "(815) 501-1478";
  const PHONE_HREF = "tel:18155011478";
  const STYLE_ID = "mobile-call-cta-style";

  const styles = `
    .mobile-call-cta {
      display: none;
    }

    @media (max-width: 767px) {
      .mobile-call-cta {
        align-items: center;
        background: #166534;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 999px;
        bottom: calc(14px + env(safe-area-inset-bottom));
        box-shadow: 0 18px 42px rgba(10, 38, 28, 0.36);
        color: #fff;
        display: flex;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 1rem;
        font-weight: 800;
        justify-content: center;
        left: max(14px, env(safe-area-inset-left));
        line-height: 1.1;
        min-height: 54px;
        opacity: 0;
        padding: 0.85rem 1rem;
        pointer-events: none;
        position: fixed;
        right: max(14px, env(safe-area-inset-right));
        text-decoration: none;
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

      .mobile-call-cta:hover,
      .mobile-call-cta:active {
        background: #14532d;
        color: #fff;
        text-decoration: none;
      }

      .mobile-call-cta:focus-visible {
        outline: 3px solid #facc15;
        outline-offset: 3px;
      }

      .mobile-call-cta__phone {
        font-size: 0.92rem;
        font-weight: 700;
        margin-left: 0.55rem;
        opacity: 0.92;
      }
    }

    @media (max-width: 340px) {
      .mobile-call-cta__phone {
        display: none;
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
          background-color 160ms ease,
          opacity 180ms ease,
          transform 180ms ease,
          visibility 180ms ease;
      }

      .mobile-call-cta.is-visible:hover {
        transform: translateY(-1px);
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

  const appendCallButton = () => {
    if (document.querySelector("[data-mobile-call-cta]")) return;

    injectStyles();

    const link = document.createElement("a");
    link.href = PHONE_HREF;
    link.className = "mobile-call-cta";
    link.dataset.mobileCallCta = "true";
    link.dataset.layoutIgnore = "fixed-cta";
    link.setAttribute(
      "aria-label",
      `Call Hernandez Landscape now at ${PHONE_DISPLAY}`,
    );
    link.innerHTML = `Call Now <span class="mobile-call-cta__phone">${PHONE_DISPLAY}</span>`;

    document.body.append(link);

    const hero = document.querySelector(".site-hero");
    const quote = document.getElementById("quote");
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

      link.classList.toggle("is-visible", shouldShow);
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
    link.addEventListener("click", () => {
      if (typeof window.hlsTrack === "function") {
        window.hlsTrack("phone_click", { source: "mobile_sticky_cta" });
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
