(() => {
  const PHONE_DISPLAY = '(815) 501-1478';
  const PHONE_HREF = 'tel:18155011478';
  const STYLE_ID = 'mobile-call-cta-style';

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
        padding: 0.85rem 1rem;
        position: fixed;
        right: max(14px, env(safe-area-inset-right));
        text-decoration: none;
        z-index: 1000;
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

    @media (prefers-reduced-motion: no-preference) and (max-width: 767px) {
      .mobile-call-cta {
        transition: background-color 160ms ease, transform 160ms ease;
      }

      .mobile-call-cta:hover {
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
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = styles;
    document.head.append(style);
  };

  const appendCallButton = () => {
    if (document.querySelector('[data-mobile-call-cta]')) return;

    injectStyles();

    const link = document.createElement('a');
    link.href = PHONE_HREF;
    link.className = 'mobile-call-cta';
    link.dataset.mobileCallCta = 'true';
    link.dataset.layoutIgnore = 'fixed-cta';
    link.setAttribute('aria-label', `Call Hernandez Landscape now at ${PHONE_DISPLAY}`);
    link.innerHTML = `Call Now <span class="mobile-call-cta__phone">${PHONE_DISPLAY}</span>`;

    document.body.append(link);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendCallButton, { once: true });
  } else {
    appendCallButton();
  }
})();
