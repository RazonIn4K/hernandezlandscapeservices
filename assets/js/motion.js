(() => {
  const SELECTOR = ".reveal, .reveal-left, .reveal-right";

  const activateAll = (elements) => {
    elements.forEach((el) => el.classList.add("active"));
  };

  const initReveal = () => {
    const elements = Array.from(document.querySelectorAll(SELECTOR));
    if (!elements.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      activateAll(elements);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        });
      },
      {
        // A full service card can be taller than a phone viewport. Requiring
        // 12% of that card to fit at once can leave its content hidden.
        threshold: 0.01,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    try {
      elements.forEach((el) => {
        observer.observe(el);
        el.classList.add("reveal-pending");
      });
    } catch (_) {
      observer.disconnect();
      activateAll(elements);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReveal, { once: true });
  } else {
    initReveal();
  }
})();
