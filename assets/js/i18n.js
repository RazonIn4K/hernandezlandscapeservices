(function () {
  "use strict";

  const DEFAULT_LANG = "en";
  const STORAGE_KEY = "siteLanguage";
  const languageListeners = [];
  const elementOriginalContent = new WeakMap();

  const translations = {
    en: {
      "admin.file.empty": "No media selected yet.",
      "admin.file.titleLabel": "Title (optional)",
      "admin.file.titlePlaceholder": "Project title",
      "admin.file.descriptionLabel": "Description (optional)",
      "admin.file.descriptionPlaceholder": "Add a short note about this upload.",
      "admin.file.type.image": "Photo",
      "admin.file.type.video": "Video",
      "admin.upload.instructions": "Drag and drop your photos or videos, or choose them from your device.",
      "admin.dropzone.prompt": "Drop your files here or",
      "admin.dropzone.button": "Choose files",
      "admin.upload.button": "Upload media",
      "admin.publish.label": "Publish immediately",
      "admin.message.selectImage": "Select at least one media file to upload.",
      "admin.message.uploading": "Uploading your media...",
      "admin.message.uploadSuccess": "All set! Your media is now in the gallery.",
      "admin.message.duplicates": "Those files were already on the list.",
      "admin.message.skipped": "Only photo or video files are allowed.",
      "admin.message.filesAdded.one": "Added {{count}} media item to the upload list.",
      "admin.message.filesAdded.other": "Added {{count}} media items to the upload list.",
      "gallery.latest.videoTag": "Video",
      "admin.manager.heading": "Manage gallery media",
      "admin.manager.filter.all": "All items",
      "admin.manager.filter.photos": "Photos",
      "admin.manager.filter.videos": "Videos",
      "admin.manager.filter.unpublished": "Unpublished",
      "admin.manager.empty": "No media uploaded yet.",
      "admin.manager.tag.draft": "Unpublished",
      "admin.manager.publish": "Publish",
      "admin.manager.unpublish": "Set as draft",
      "admin.manager.view": "Open",
      "admin.manager.delete": "Delete",
      "admin.manager.errorLoad": "Unable to load existing media items. Please refresh.",
      "admin.manager.errorUpdate": "Unable to update publish status. Try again.",
      "admin.manager.errorDelete": "Unable to delete media item. Try again.",
      "admin.manager.confirmDelete": "Delete this media item? This cannot be undone.",
      "admin.manager.deleteSuccess": "Media item deleted.",
      "admin.manager.publishSuccess": "Item published.",
      "admin.manager.unpublishSuccess": "Item marked as draft.",

      "alerts.instant.missing":
        "Please select a service type, property size, and enter your ZIP code.",
      "alerts.contact.invalid": "Please fill in all required fields correctly.",
      "alerts.contact.success":
        "Thank you for your interest! We will call you within 24 hours.",
      "alerts.contact.error":
        "There was an error sending your request. Please call us at 815-501-1478.",
      "contact.sending": "Sending...",
      "gallery.loading": "Loading gallery...",
      "gallery.error.configMissing":
        "Missing assets/js/firebase-config.js. Add it to load photos.",
      "gallery.error.firebase":
        "Unable to load Firebase. Check your connection.",
      "gallery.error.generic":
        "We could not load the photos right now. Please try again.",
      "gallery.loadMore": "Load more photos",
      "gallery.loadingButton": "Loading...",
      "serviceArea.mapNote": "Zoom in on our DeKalb base; we cover all of DeKalb County and nearby communities.",
    },
    es: {
      "admin.file.empty": "No hay archivos seleccionados todavía.",
      "admin.file.titleLabel": "Título (opcional)",
      "admin.file.titlePlaceholder": "Título breve del proyecto",
      "admin.file.descriptionLabel": "Descripción (opcional)",
      "admin.file.descriptionPlaceholder": "Agrega una nota rápida sobre este archivo.",
      "admin.file.type.image": "Foto",
      "admin.file.type.video": "Video",
      "admin.upload.instructions": "Arrastra y suelta tus fotos o videos, o selecciónalos desde tu dispositivo.",
      "admin.dropzone.prompt": "Suelta los archivos aquí o",
      "admin.dropzone.button": "Elegir archivos",
      "admin.upload.button": "Subir archivos",
      "admin.publish.label": "Publicar de inmediato",
      "admin.message.selectImage": "Selecciona al menos un archivo multimedia para subir.",
      "admin.message.uploading": "Subiendo tus archivos...",
      "admin.message.uploadSuccess": "¡Listo! Tus archivos ya están en la galería.",
      "admin.message.duplicates": "Estos archivos ya estaban en la lista.",
      "admin.message.skipped": "Solo se permiten archivos de foto o video.",
      "admin.message.filesAdded.one": "Se añadió {{count}} archivo a la lista.",
      "admin.message.filesAdded.other": "Se añadieron {{count}} archivos a la lista.",
      "gallery.latest.videoTag": "Video",
      "admin.manager.heading": "Administrar la galería",
      "admin.manager.filter.all": "Todos los elementos",
      "admin.manager.filter.photos": "Fotos",
      "admin.manager.filter.videos": "Videos",
      "admin.manager.filter.unpublished": "Borradores",
      "admin.manager.empty": "Aún no hay archivos subidos.",
      "admin.manager.tag.draft": "Borrador",
      "admin.manager.publish": "Publicar",
      "admin.manager.unpublish": "Marcar como borrador",
      "admin.manager.view": "Abrir",
      "admin.manager.delete": "Eliminar",
      "admin.manager.errorLoad": "No se pudieron cargar los archivos. Vuelve a intentarlo.",
      "admin.manager.errorUpdate": "No se pudo actualizar el estado de publicación.",
      "admin.manager.errorDelete": "No se pudo eliminar el archivo. Inténtalo nuevamente.",
      "admin.manager.confirmDelete": "¿Eliminar este archivo? Esta acción no se puede deshacer.",
      "admin.manager.deleteSuccess": "Archivo eliminado.",
      "admin.manager.publishSuccess": "Archivo publicado.",
      "admin.manager.unpublishSuccess": "Archivo marcado como borrador.",

      "admin.heading": "Sube tus fotos",
      "admin.subheading": "Inicia sesión con tu número para compartir nuevos proyectos.",
      "admin.phone.label": "Número de teléfono",
      "admin.phone.placeholder": "+1 815 555 1234",
      "admin.phone.send": "Enviar código",
      "admin.code.label": "Código de verificación",
      "admin.code.placeholder": "123456",
      "admin.code.verify": "Verificar e ingresar",
      "admin.upload.heading": "Subir fotografías",
      "admin.logout": "Cerrar sesión",
      "admin.upload.instructions": "Arrastra y suelta tus fotos o videos, o selecciónalos desde tu dispositivo.",
      "admin.dropzone.prompt": "Suelta tus archivos aquí o",
      "admin.dropzone.button": "Elegir fotos",
      "admin.file.empty": "No hay archivos seleccionados todavía.",
      "admin.file.remove": "Quitar",
      "admin.upload.button": "Subir archivos",
      "admin.message.invalidPhone":
        "Introduce un número válido. Ejemplo: 8155551234 o +18155551234.",
      "admin.message.sendingCode": "Enviando código por SMS...",
      "admin.message.codeSent": "Código enviado. Revisa tu teléfono e ingrésalo abajo.",
      "admin.message.smsError":
        "No pudimos enviar el SMS. Verifica el número o inténtalo más tarde.",
      "admin.message.requestCodeFirst": "Solicita un nuevo código antes de confirmar.",
      "admin.message.enterCode": "Ingresa el código de 6 dígitos recibido por SMS.",
      "admin.message.verifying": "Verificando código...",
      "admin.message.loginSuccess": "Sesión iniciada. ¡Listo para subir fotos!",
      "admin.message.invalidCode": "Código incorrecto o vencido. Solicita uno nuevo.",
      "admin.message.notAllowed": "Este número no tiene permiso para subir fotos.",
      "admin.message.selectImage": "Selecciona al menos un archivo multimedia.",
      "admin.message.uploading": "Subiendo tus archivos...",
      "admin.message.uploadFailedList": "No pudimos subir estas imágenes: {{list}}.",
      "admin.message.uploadFailedGeneric":
        "Ocurrió un problema con algunas imágenes. Intenta de nuevo.",
      "admin.message.uploadSuccess": "¡Listo! Tus archivos ya están en la galería.",
      "admin.message.noUploads": "No se subió ninguna imagen.",
      "admin.message.duplicates": "Estos archivos ya estaban en la lista.",
      "admin.message.skipped": "Solo se permiten archivos de foto o video.",
      "admin.message.filesAdded.one": "Se añadió {{count}} archivo a la lista.",
      "admin.message.filesAdded.other": "Se añadieron {{count}} archivos a la lista.",
      "nav.services": "Servicios",
      "nav.work": "Nuestro Trabajo",
      "nav.reviews": "Reseñas",
      "nav.serviceArea": "Zonas de Servicio",
      "nav.freeQuote": "Solicitar Cotización",

      "hero.heading":
        'Transforma tu<br><span class="text-green-400">Espacio Exterior</span>',
      "hero.subheading":
        "Servicios profesionales de jardinería y árboles en el Condado de DeKalb. Empresa familiar, completamente asegurada y comprometida con la excelencia.",
      "hero.cta.instant": "Obtén cotización instantánea",
      "hero.cta.call": "Llámanos ahora",
      "hero.badge.insured": "Totalmente asegurados",
      "hero.badge.licensed": "LLC con licencia",
      "hero.badge.family": "Negocio familiar",
      "hero.badge.bilingual": "Hablamos Español",

      "instant.heading": "Obtén tu estimado al instante",
      "instant.label.serviceType": "Tipo de servicio",
      "instant.option.servicePlaceholder": "Selecciona un servicio...",
      "instant.option.lawn": "Corte de césped (semanal)",
      "instant.option.tree": "Servicio de árboles",
      "instant.option.landscaping": "Diseño de paisajismo",
      "instant.option.cleanup": "Limpieza de primavera/otoño",
      "instant.option.snow": "Remoción de nieve",
      "instant.label.propertySize": "Tamaño de la propiedad",
      "instant.option.sizePlaceholder": "Selecciona el tamaño...",
      "instant.option.sizeSmall": "Pequeña (&lt; 5,000 pies²)",
      "instant.option.sizeMedium": "Mediana (5,000 - 10,000 pies²)",
      "instant.option.sizeLarge": "Grande (10,000 - 20,000 pies²)",
      "instant.option.sizeXLarge": "Muy grande (&gt; 20,000 pies²)",
      "instant.label.zip": "Tu código postal",
      "instant.placeholder.zip": "ej., 60115",
      "instant.title.zip": "Ingresa un código postal válido de 5 dígitos",
      "instant.button.calculate": "Calcular estimado",
      "instant.result.heading": "Rango de precio estimado:",
      "instant.result.disclaimer":
        "Este es un estimado. El precio final depende de requisitos específicos y de la evaluación en sitio.",
      "instant.result.call": "Llama para una cotización exacta",

      "services.heading": "Nuestros servicios profesionales",
      "services.subheading":
        "Trabajo de calidad, precios competitivos y satisfacción garantizada",
      "services.lawn.title": "Cuidado del césped",
      "services.lawn.item1": "Corte y bordes semanales",
      "services.lawn.item2": "Programas de fertilización",
      "services.lawn.item3": "Control de maleza",
      "services.lawn.item4": "Aireación y resiembra",
      "services.tree.title": "Servicio de árboles",
      "services.tree.item1": "Poda y recorte de árboles",
      "services.tree.item2": "Remoción segura de árboles",
      "services.tree.item3": "Destoconado",
      "services.tree.item4": "Servicio de emergencia 24/7",
      "services.landscaping.title": "Paisajismo",
      "services.landscaping.item1": "Diseño personalizado de jardines",
      "services.landscaping.item2": "Instalación de mulch y piedra",
      "services.landscaping.item3": "Instalación de césped",
      "services.landscaping.item4": "Limpieza estacional",
      "services.cta": "Solicitar cotización",
      "services.extra.heading": "También disponibles:",
      "services.extra.snow": "Remoción de nieve",
      "services.extra.leaf": "Recolección de hojas",
      "services.extra.gutter": "Limpieza de canaletas",
      "services.extra.pressure": "Lavado a presión",

      "gallery.heading": "Mira la diferencia que logramos",
      "gallery.subheading": "Desliza para ver nuestras transformaciones",
      "gallery.moreHeading": "Más de nuestro trabajo",
      "gallery.card1.title": "Renovación total del jardín",
      "gallery.card1.subtitle": "Residencia en DeKalb",
      "gallery.card2.title": "Poda profesional de árboles",
      "gallery.card2.subtitle": "Comercial en Sycamore",
      "gallery.card3.title": "Diseño personalizado de jardín",
      "gallery.card3.subtitle": "Hogar en Cortland",
      "gallery.latestHeading": "Últimas fotos subidas",
      "gallery.placeholder":
        "Tus nuevas fotos aparecerán aquí después de subirlas.",
      "gallery.facebookCta": "Ver más en Facebook",
      "gallery.loading": "Cargando galería...",
      "gallery.error.configMissing":
        "Falta el archivo assets/js/firebase-config.js. Añádelo para cargar las fotos.",
      "gallery.error.firebase":
        "No se pudo cargar Firebase. Revisa tu conexión.",
      "gallery.error.generic":
        "No pudimos cargar las fotos en este momento. Intenta nuevamente.",
      "gallery.loadMore": "Cargar más fotos",
      "gallery.loadingButton": "Cargando...",

      "testimonials.heading": "Lo que dicen nuestros clientes",
      "testimonials.quote1":
        '"¡Servicio excelente! Transformaron nuestro jardín descuidado en un paisaje hermoso. Muy profesionales y el precio fue justo. ¡Altamente recomendados!"',
      "testimonials.author1": "- Maria G., DeKalb",
      "testimonials.quote2":
        '"Respuesta rápida para remover un árbol después de la tormenta. Trabajaron de forma segura, eficiente y dejaron todo limpio. ¡El mejor servicio de árboles de la zona!"',
      "testimonials.author2": "- John D., Sycamore",
      "testimonials.quote3":
        '"Se encargan de nuestro mantenimiento semanal del césped y siempre queda perfecto. Confiables, accesibles y hablan español, lo cual ayuda a mi familia."',
      "testimonials.author3": "- Rosa M., Cortland",

      "serviceArea.heading": "Zonas en las que trabajamos",
      "serviceArea.subheading": "Orgullosos de servir al condado de DeKalb",
      "serviceArea.description":
        "Con base en DeKalb, ofrecemos servicios profesionales de jardinería y árboles en todo el condado. Respuesta rápida y precios competitivos para cada zona.",
      "serviceArea.primaryHeading": "Zonas principales:",
      "serviceArea.secondaryHeading": "También atendemos:",
      "serviceArea.info":
        "¿No estás seguro si cubrimos tu área? ¡Llámanos! Seguimos ampliando nuestra zona de servicio.",
      "serviceArea.mapPlaceholder": "Mapa interactivo muy pronto",
      "serviceArea.mapNote": "Haz zoom y explora nuestra base en DeKalb; atendemos todo el condado y comunidades cercanas.",

      "quote.heading": "¿Listo para transformar tu propiedad?",
      "quote.contactHeading": "Ponte en contacto",
      "quote.phoneLabel": "Llamar o enviar mensaje",
      "quote.emailLabel": "Correo electrónico",
      "quote.hoursLabel": "Horario de atención",
      "quote.hoursWeekdays": "Lun-Vie: 7 a. m. - 6 p. m.",
      "quote.hoursSaturday": "Sábado: 8 a. m. - 4 p. m.",
      "quote.locationLabel": "Ubicación",
      "quote.followLabel": "Síguenos",
      "quote.facebook": "Facebook",
      "quote.formHeading": "Solicita una cotización gratis",
      "quote.placeholder.name": "Tu nombre",
      "quote.placeholder.phone": "Número de teléfono",
      "quote.title.phone": "Ingresa un número de 10 dígitos (ej., 8155011478)",
      "quote.placeholder.email": "Correo electrónico (opcional)",
      "quote.select.placeholder": "Selecciona el servicio requerido",
      "quote.select.lawn": "Cuidado del césped",
      "quote.select.tree": "Servicio de árboles",
      "quote.select.landscaping": "Paisajismo",
      "quote.select.snow": "Remoción de nieve",
      "quote.select.multiple": "Múltiples servicios",
      "quote.placeholder.project": "Cuéntanos sobre tu proyecto...",
      "quote.submit": "Enviar solicitud de cotización",

      "footer.copy": "© 2025 Hernandez Landscape & Tree Service LLC",
      "footer.license": "Illinois LLC #13934835 • Licencia y seguro vigentes",
      "footer.tagline":
        "Servicios profesionales de jardinería en el condado de DeKalb",
      "footer.follow": "Síguenos",
      "footer.facebook": "Facebook",
      "footer.maps": "Google Maps",

      "modal.close": "Cerrar",

      "alerts.instant.missing":
        "Selecciona un tipo de servicio, tamaño de propiedad e ingresa tu código postal.",
      "alerts.contact.invalid":
        "Completa todos los campos requeridos correctamente.",
      "alerts.contact.success":
        "¡Gracias por tu interés! Te llamaremos en un plazo de 24 horas.",
      "alerts.contact.error":
        "Hubo un error al enviar tu solicitud. Llámanos al 815-501-1478.",
      "contact.sending": "Enviando...",
    },
  };

  let currentLang = DEFAULT_LANG;

  function getTranslation(key, lang = currentLang) {
    if (lang === "es" && translations.es[key]) {
      return translations.es[key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return null;
  }

  function updateToggleButtons(lang) {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      const isActive = button.dataset.langSwitch === lang;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("bg-green-600", isActive);
      button.classList.toggle("text-white", isActive);
      button.classList.toggle("text-gray-700", !isActive);
      button.classList.toggle("hover:text-green-600", !isActive);
      button.classList.toggle("cursor-default", isActive);
      button.classList.toggle("cursor-pointer", !isActive);
    });
  }

  function refreshTextContent(lang) {
    document.querySelectorAll("[data-i18n-key]").forEach((element) => {
      if (!elementOriginalContent.has(element)) {
        elementOriginalContent.set(element, element.innerHTML);
      }
      const key = element.dataset.i18nKey;
      const translation = getTranslation(key, lang);
      if (lang === "es" && translation) {
        element.innerHTML = translation;
      } else {
        element.innerHTML = elementOriginalContent.get(element);
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      if (!element.dataset.placeholderEn) {
        element.dataset.placeholderEn =
          element.getAttribute("placeholder") || "";
      }
      const key = element.dataset.i18nPlaceholder;
      const translation = getTranslation(key, lang);
      const value =
        lang === "es" && translation
          ? translation
          : element.dataset.placeholderEn;
      element.setAttribute("placeholder", value);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      if (!element.dataset.titleEn) {
        element.dataset.titleEn = element.getAttribute("title") || "";
      }
      const key = element.dataset.i18nTitle;
      const translation = getTranslation(key, lang);
      const value =
        lang === "es" && translation ? translation : element.dataset.titleEn;
      if (value) {
        element.setAttribute("title", value);
      }
    });
  }

  function applyLanguage(lang) {
    const targetLang = lang === "es" ? "es" : DEFAULT_LANG;
    currentLang = targetLang;

    document.documentElement.setAttribute(
      "lang",
      targetLang === "es" ? "es" : "en",
    );
    document.body.dataset.language = targetLang;

    refreshTextContent(targetLang);
    updateToggleButtons(targetLang);

    try {
      localStorage.setItem(STORAGE_KEY, targetLang);
    } catch (error) {
      console.warn("Unable to persist language preference.", error);
    }

    languageListeners.forEach((listener) => {
      try {
        listener(targetLang);
      } catch (error) {
        console.error("Language listener error:", error);
      }
    });
  }

  function initializeLanguageSelector() {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => {
        applyLanguage(button.dataset.langSwitch || DEFAULT_LANG);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeLanguageSelector();
    const savedLanguage = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        return null;
      }
    })();
    applyLanguage(savedLanguage === "es" ? "es" : DEFAULT_LANG);
  });

  window.siteI18n = {
    setLanguage: applyLanguage,
    getLanguage: () => currentLang,
    t: (key, lang) => {
      const translation = getTranslation(key, lang);
      if (translation) {
        return translation;
      }
      const element = document.querySelector(`[data-i18n-key="${key}"]`);
      if (element && elementOriginalContent.has(element)) {
        return currentLang === "es"
          ? getTranslation(key, "es") || elementOriginalContent.get(element)
          : elementOriginalContent.get(element);
      }
      return element ? element.textContent.trim() : "";
    },
    onChange: (listener) => {
      if (typeof listener === "function") {
        languageListeners.push(listener);
      }
    },
  };
})();
