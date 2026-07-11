(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var main = document.querySelector("main");
  if (!header || !main) return;

  header.id = header.id || "header";
  main.id = main.id || "main-content";

  if (!document.querySelector('a.skip-link[href="#main-content"]')) {
    var skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = "#main-content";
    skipLink.textContent = document.documentElement.lang.startsWith("es")
      ? "Saltar al contenido principal"
      : "Skip to main content";
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  var nav = header.querySelector("nav");
  if (!nav) return;

  var isSpanish = document.documentElement.lang.startsWith("es");
  var labels = isSpanish
    ? {
        open: "Abrir menú de navegación",
        close: "Cerrar menú de navegación",
        navigation: "Navegación móvil",
        services: "Servicios",
        work: "Nuestro trabajo",
        videos: "Videos",
        areas: "Áreas de servicio",
        quote: "Cotización gratis",
      }
    : {
        open: "Open navigation menu",
        close: "Close navigation menu",
        navigation: "Mobile navigation",
        services: "Services",
        work: "Our Work",
        videos: "Videos",
        areas: "Service Areas",
        quote: "Get Free Quote",
      };

  var button = document.getElementById("mobileMenuButton");
  var menu = document.getElementById("mobileMenu");
  var logo = nav.querySelector('img[alt*="Hernandez"]');
  var logoLink = logo && logo.closest("a");

  if (logoLink && logoLink.parentElement === nav) {
    var label = logoLink.querySelector("span");
    if (label) label.classList.add("hidden", "sm:inline");
  } else if (logoLink && logoLink.parentElement) {
    Array.prototype.slice.call(logoLink.parentElement.children, 1).forEach(
      function (brandCopy) {
        brandCopy.classList.add("hidden", "sm:block");
      },
    );
  }

  if (!button || !menu) {
    var originalChildren = Array.prototype.slice.call(nav.children, 1);
    originalChildren.forEach(function (child) {
      child.classList.add("hidden", "lg:flex");
    });

    button = document.createElement("button");
    button.id = "mobileMenuButton";
    button.type = "button";
    button.className =
      "lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-gray-700 hover:bg-green-50 hover:text-green-700";
    button.setAttribute("aria-controls", "mobileMenu");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", labels.open);
    button.textContent = "☰";
    nav.appendChild(button);

    menu = document.createElement("div");
    menu.id = "mobileMenu";
    menu.className =
      "hidden absolute w-full border-t bg-white shadow-lg lg:hidden";
    menu.setAttribute("aria-hidden", "true");

    var mobileNav = document.createElement("nav");
    mobileNav.className = "container mx-auto space-y-1 px-4 py-4";
    mobileNav.setAttribute("aria-label", labels.navigation);

    [
      ["/#services", labels.services, ""],
      ["/gallery/", labels.work, ""],
      ["/videos/", labels.videos, ""],
      ["/service-areas/", labels.areas, ""],
      ["/#quote", labels.quote, "quote"],
    ].forEach(function (item) {
      var link = document.createElement("a");
      link.href = item[0];
      link.textContent = item[1];
      link.className = item[2]
        ? "mt-2 block rounded-lg bg-green-600 px-3 py-3 text-center font-bold text-white hover:bg-green-700"
        : "block rounded-lg px-3 py-3 font-semibold text-gray-700 hover:bg-green-50";
      mobileNav.appendChild(link);
    });

    menu.appendChild(mobileNav);
    header.appendChild(menu);
  }

  function setOpen(isOpen, returnFocus) {
    menu.classList.toggle("hidden", !isOpen);
    menu.setAttribute("aria-hidden", String(!isOpen));
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? labels.close : labels.open);
    button.textContent = isOpen ? "×" : "☰";

    if (isOpen) {
      var firstLink = menu.querySelector("a");
      if (firstLink) firstLink.focus();
    } else if (returnFocus) {
      button.focus();
    }
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true", false);
  });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false, false);
    });
  });
  document.addEventListener("click", function (event) {
    var eventPath = event.composedPath ? event.composedPath() : [];
    if (
      button.getAttribute("aria-expanded") === "true" &&
      !eventPath.includes(menu) &&
      !eventPath.includes(button) &&
      !menu.contains(event.target) &&
      !button.contains(event.target)
    ) {
      setOpen(false, false);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      button.getAttribute("aria-expanded") === "true"
    ) {
      setOpen(false, true);
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) setOpen(false, false);
  });
})();
