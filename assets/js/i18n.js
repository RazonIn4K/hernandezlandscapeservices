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
      "admin.file.descriptionPlaceholder":
        "Add a short note about this upload.",
      "admin.file.type.image": "Photo",
      "admin.file.type.video": "Video",
      "admin.upload.instructions":
        "Drag and drop your photos or videos, or choose them from your device.",
      "admin.dropzone.prompt": "Drop your files here or",
      "admin.dropzone.button": "Choose files",
      "admin.upload.button": "Upload media",
      "admin.publish.label": "Publish immediately",
      "admin.message.selectImage": "Select at least one media file to upload.",
      "admin.message.uploading": "Uploading your media...",
      "admin.message.uploadSuccess":
        "All set! Your media is now in the gallery.",
      "admin.message.duplicates": "Those files were already on the list.",
      "admin.message.skipped": "Only photo or video files are allowed.",
      "admin.message.filesAdded.one":
        "Added {{count}} media item to the upload list.",
      "admin.message.filesAdded.other":
        "Added {{count}} media items to the upload list.",
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
      "admin.manager.errorLoad":
        "Unable to load existing media items. Please refresh.",
      "admin.manager.errorUpdate":
        "Unable to update publish status. Try again.",
      "admin.manager.errorDelete": "Unable to delete media item. Try again.",
      "admin.manager.confirmDelete":
        "Delete this media item? This cannot be undone.",
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
      "instant.handoff.prefix": "Instant estimate request:",
      "instant.handoff.range": "Estimated range:",
      "gallery.loading": "Loading gallery...",
      "gallery.error.configMissing":
        "Missing assets/js/firebase-config.js. Add it to load photos.",
      "gallery.error.firebase":
        "Unable to load Firebase. Check your connection.",
      "gallery.error.generic":
        "We could not load the photos right now. Please try again.",
      "gallery.loadMore": "Load more photos",
      "gallery.loadingButton": "Loading...",
      "gallery.slider.value": "Comparison divider at {{value}}%",
      "gallery.slider.label": "Reveal the after photo",
      "nav.menuToggle": "Toggle mobile menu",
      "serviceArea.mapNote":
        "Zoom in on our DeKalb base; we cover all of DeKalb County and nearby communities.",

      "video.heading": "Project Video Tours",
      "video.subheading":
        "Watch our team in action and see the details of our work.",

      "gallery.recent.heading": "Recent Projects",
      "gallery.item.project": "Project",
      "nav.contact": "Contact",
      "nav.videos": "Videos",
      "video.viewAll": "View All Videos",
      "video.control.label": "Hernandez Landscape project video {{number}}",

      "hero.eyebrow": "DeKalb County Landscaping & Tree Service",
      "hero.transform": "Tree Removal, Lawn Care &",
      "hero.outdoor": "Landscaping in DeKalb, IL",
      "hero.subtitle":
        "Tree trimming, removal, lawn care, and landscaping from a family-owned DeKalb County crew. Free estimates in English or Spanish.",
      "hero.emergency": "Storm damage? 24/7 emergency tree service",
      "hero.emergencyCall": "Call (815) 501-1478",
      "hero.cta": "See Starting Range",
      "hero.call": "Call Now",
      "hero.insured": "Fully Insured",
      "hero.licensed": "Licensed LLC",
      "hero.family": "Family Owned",
      "hero.bilingual": "Se Habla Español",
      "instant.button.calculate": "See Starting Range",
      "testimonials.heading": "Featured Customer Feedback",
      "testimonials.subheading":
        "A recent published review for the DeKalb business listing, plus the service standards local homeowners usually want confirmed before they book.",
      "testimonials.badge": "5.0 public review",
      "testimonials.reviewLabel": "Published June 19",
      "testimonials.reviewQuote":
        "Robert Tolito praised the team for turning his lawn into a beautifully manicured space, working efficiently, and paying attention to the details he requested.",
      "testimonials.reviewAuthor": "Robert Tolito",
      "testimonials.reviewMeta":
        "Public review tied to the Hernandez Landscape DeKalb business listing.",
      "testimonials.reviewSource": "View source review",
      "testimonials.supportTitle":
        "What local homeowners want confirmed before they call",
      "testimonials.support1":
        "A clear response on pricing and next steps",
      "testimonials.support2":
        "Clean finish and detail-focused work on-site",
      "testimonials.support3":
        "Bilingual communication for scheduling and updates",
      "testimonials.ctaEyebrow": "Ready for your quote?",
      "testimonials.ctaText":
        "Choose the service you need and send the property details. The team follows up with the right next step instead of a generic reply.",
      "testimonials.ctaButton": "Request Free Quote",
      "quote.prefill.prefix": "Selected service:",
      "quote.prefill.helper":
        "Add your property details below and the team can respond with the right next step.",
      "quote.formHelper":
        "Tell us what you need. We usually respond within 24 hours, and there is no obligation.",
      "quote.label.name": "Your Name",
      "quote.label.phone": "Phone Number",
      "quote.label.email": "Email (optional)",
      "quote.label.address": "Property Address",
      "quote.label.bestTime": "Best Time to Call",
      "quote.label.service": "Select Service Needed",
      "quote.label.project": "Tell us about your project",
      "quote.privacyNote":
        "Your details are used only to respond to this request.",
      "services.learnMore": "Learn More",
      "pricing.heading": "Custom Landscaping Pricing",
      "pricing.copy":
        "Every yard, project, and season is different. We build tailored estimates after learning about your property and goals so you only pay for the services you need.",
      "pricing.cta": "Request a Personalized Quote",
      "faq.heading": "Frequently Asked Questions",
      "faq.q1": "Do you provide free estimates for tree removal in DeKalb?",
      "faq.a1":
        "Yes, we provide free, no-obligation estimates for all tree removal, tree trimming, and landscaping projects in DeKalb County and surrounding areas.",
      "faq.q2": "Is Hernandez Landscape & Tree Service licensed and insured?",
      "faq.a2":
        "Yes, we are a fully licensed and insured LLC (Auth #13934835) protecting your property during all tree and landscaping work.",
      "faq.q3": "What areas do you serve outside of DeKalb?",
      "faq.a3":
        "Our primary service areas are DeKalb and Sycamore. We also serve Cortland, Malta, Genoa, Kingston, Rochelle, Hinckley, St. Charles, and West Chicago.",
      "faq.q4": "Do you offer emergency tree removal services?",
      "faq.a4":
        "Yes, we offer 24/7 emergency tree service for fallen or hazardous trees that pose an immediate threat to your home or property.",
      "faq.q5": "Do you provide snow removal for residential properties?",
      "faq.a5":
        "Yes, we offer seasonal snow removal services for both residential and commercial properties in the DeKalb area, subject to availability.",
      "quote.select.leaf": "Leaf Removal",
      "quote.select.gutter": "Gutter Cleaning",
      "quote.select.pressure": "Pressure Washing",
      "services.recent.eyebrow": "Fresh Profile Photos",
      "services.recent.heading": "Recent Tree Service & Equipment Work",
      "services.recent.copy":
        "New project photos from the verified Hernandez Landscape & Tree Service LLC business profile.",
      "services.recent.cta": "View Full Gallery",
      "footer.privacy": "Privacy Policy",
      "footer.terms": "Terms of Service",
    },
    es: {
      "admin.file.empty": "No hay archivos seleccionados todavía.",
      "admin.file.titleLabel": "Título (opcional)",
      "admin.file.titlePlaceholder": "Título breve del proyecto",
      "admin.file.descriptionLabel": "Descripción (opcional)",
      "admin.file.descriptionPlaceholder":
        "Agrega una nota rápida sobre este archivo.",
      "admin.file.type.image": "Foto",
      "admin.file.type.video": "Video",
      "admin.upload.instructions":
        "Arrastra y suelta tus fotos o videos, o selecciónalos desde tu dispositivo.",
      "admin.dropzone.prompt": "Suelta los archivos aquí o",
      "admin.dropzone.button": "Elegir archivos",
      "admin.upload.button": "Subir archivos",
      "admin.publish.label": "Publicar de inmediato",
      "admin.message.selectImage":
        "Selecciona al menos un archivo multimedia para subir.",
      "admin.message.uploading": "Subiendo tus archivos...",
      "admin.message.uploadSuccess":
        "¡Listo! Tus archivos ya están en la galería.",
      "admin.message.duplicates": "Estos archivos ya estaban en la lista.",
      "admin.message.skipped": "Solo se permiten archivos de foto o video.",
      "admin.message.filesAdded.one": "Se añadió {{count}} archivo a la lista.",
      "admin.message.filesAdded.other":
        "Se añadieron {{count}} archivos a la lista.",
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
      "admin.manager.errorLoad":
        "No se pudieron cargar los archivos. Vuelve a intentarlo.",
      "admin.manager.errorUpdate":
        "No se pudo actualizar el estado de publicación.",
      "admin.manager.errorDelete":
        "No se pudo eliminar el archivo. Inténtalo nuevamente.",
      "admin.manager.confirmDelete":
        "¿Eliminar este archivo? Esta acción no se puede deshacer.",
      "admin.manager.deleteSuccess": "Archivo eliminado.",
      "admin.manager.publishSuccess": "Archivo publicado.",
      "admin.manager.unpublishSuccess": "Archivo marcado como borrador.",

      "admin.heading": "Sube tus fotos",
      "admin.subheading":
        "Inicia sesión con tu número para compartir nuevos proyectos.",
      "admin.phone.label": "Número de teléfono",
      "admin.phone.placeholder": "+1 815 555 1234",
      "admin.phone.send": "Enviar código",
      "admin.code.label": "Código de verificación",
      "admin.code.placeholder": "123456",
      "admin.code.verify": "Verificar e ingresar",
      "admin.upload.heading": "Subir fotografías",
      "admin.logout": "Cerrar sesión",
      "admin.upload.instructions":
        "Arrastra y suelta tus fotos o videos, o selecciónalos desde tu dispositivo.",
      "admin.dropzone.prompt": "Suelta tus archivos aquí o",
      "admin.dropzone.button": "Elegir fotos",
      "admin.file.empty": "No hay archivos seleccionados todavía.",
      "admin.file.remove": "Quitar",
      "admin.upload.button": "Subir archivos",
      "admin.message.invalidPhone":
        "Introduce un número válido. Ejemplo: 8155551234 o +18155551234.",
      "admin.message.sendingCode": "Enviando código por SMS...",
      "admin.message.codeSent":
        "Código enviado. Revisa tu teléfono e ingrésalo abajo.",
      "admin.message.smsError":
        "No pudimos enviar el SMS. Verifica el número o inténtalo más tarde.",
      "admin.message.requestCodeFirst":
        "Solicita un nuevo código antes de confirmar.",
      "admin.message.enterCode":
        "Ingresa el código de 6 dígitos recibido por SMS.",
      "admin.message.verifying": "Verificando código...",
      "admin.message.loginSuccess": "Sesión iniciada. ¡Listo para subir fotos!",
      "admin.message.invalidCode":
        "Código incorrecto o vencido. Solicita uno nuevo.",
      "admin.message.notAllowed":
        "Este número no tiene permiso para subir fotos.",
      "admin.message.selectImage": "Selecciona al menos un archivo multimedia.",
      "admin.message.uploading": "Subiendo tus archivos...",
      "admin.message.uploadFailedList":
        "No pudimos subir estas imágenes: {{list}}.",
      "admin.message.uploadFailedGeneric":
        "Ocurrió un problema con algunas imágenes. Intenta de nuevo.",
      "admin.message.uploadSuccess":
        "¡Listo! Tus archivos ya están en la galería.",
      "admin.message.noUploads": "No se subió ninguna imagen.",
      "admin.message.duplicates": "Estos archivos ya estaban en la lista.",
      "admin.message.skipped": "Solo se permiten archivos de foto o video.",
      "admin.message.filesAdded.one": "Se añadió {{count}} archivo a la lista.",
      "admin.message.filesAdded.other":
        "Se añadieron {{count}} archivos a la lista.",
      "nav.services": "Servicios",
      "nav.work": "Nuestro Trabajo",
      "nav.videos": "Videos",
      "nav.reviews": "Reseñas",
      "nav.serviceArea": "Zonas de Servicio",
      "nav.freeQuote": "Solicitar Cotización",
      "nav.contact": "Contacto",
      "nav.home": "Inicio",
      "nav.gallery": "Nuestro trabajo",

      "hero.heading":
        'Transforma tu<br><span class="text-green-400">Espacio Exterior</span>',
      "hero.subheading":
        "Servicios profesionales de jardinería y árboles en el Condado de DeKalb. Empresa familiar, completamente asegurada y comprometida con la excelencia.",
      "hero.cta.instant": "Solicitar estimado gratis",
      "hero.cta.call": "Llámanos ahora",
      "hero.badge.insured": "Totalmente asegurados",
      "hero.badge.licensed": "LLC con licencia",
      "hero.badge.family": "Negocio familiar",
      "hero.badge.bilingual": "Hablamos Español",

      "instant.heading": "Inicia una sola solicitud de cotización",
      "instant.subtitle":
        "Usa este inicio rápido para llenar el formulario final. Nada se envía hasta que revises y envíes la solicitud final.",
      "instant.trust.free": "Estimado gratis y sin compromiso",
      "instant.trust.response": "Respuesta en menos de 24 horas",
      "instant.label.address": "Dirección de la propiedad",
      "instant.placeholder.address": "ej., 1234 Main St, DeKalb",
      "instant.label.isOwner":
        "Soy el propietario y estaré presente durante el estimado.",
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
      "instant.label.bestTime": "Mejor hora para llamar",
      "instant.button.calculate": "Ver rango inicial",
      "instant.result.heading": "Rango de precio inicial:",
      "instant.result.disclaimer":
        "Este rango inicial ayuda a orientar. El precio final depende del acceso, alcance, retiro de material y evaluación en sitio.",
      "instant.result.call": "Llama para una cotización exacta",
      "instant.result.send": "Continuar al formulario final",
      "instant.privacy":
        "Este inicio no envía ningún mensaje. Revisa y envía el formulario final.",

      "services.heading": "Nuestros servicios profesionales",
      "services.subheading":
        "Atendemos el condado de DeKalb desde 2019 — estimados gratis en inglés o español",
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
      "services.recent.eyebrow": "Fotos recientes del perfil",
      "services.recent.heading": "Trabajo reciente de árboles y equipo",
      "services.recent.copy":
        "Nuevas fotos de proyectos del perfil verificado de Hernandez Landscape & Tree Service LLC.",
      "services.recent.cta": "Ver galería completa",

      "whyChoose.heading": "¿Por qué elegir a Hernandez?",
      "whyChoose.subheading":
        "Un equipo local y asegurado, con comunicación clara desde el primer estimado hasta la limpieza final.",
      "whyChoose.feature1.title": "Cotizaciones claras y rápidas",
      "whyChoose.feature1.desc":
        "Cuéntanos qué necesitas y confirmaremos el tiempo, el alcance y los siguientes pasos.",
      "whyChoose.feature2.title": "Equipo profesional",
      "whyChoose.feature2.desc":
        "Herramientas de uso comercial para obtener mejores resultados y terminar con mayor eficiencia.",
      "whyChoose.feature3.title": "Locales y confiables",
      "whyChoose.feature3.desc":
        "Negocio familiar de DeKalb. Cuidamos tu propiedad como si fuera nuestra.",
      "whyChoose.feature4.title": "Precios claros y justos",
      "whyChoose.feature4.desc":
        "Sin cargos ocultos. Conoces el precio antes de que comience el trabajo.",
      "whyChoose.process.heading": "Qué puedes esperar",
      "whyChoose.process.step1.title": "Solicita una cotización",
      "whyChoose.process.step1.desc":
        "Llena el formulario o llámanos directamente",
      "whyChoose.process.step2.title": "Evaluación gratis",
      "whyChoose.process.step2.desc":
        "Visitamos tu propiedad para entender lo que necesitas",
      "whyChoose.process.step3.title": "Recibe tu cotización",
      "whyChoose.process.step3.desc":
        "Recibe un estimado detallado y sin sorpresas",
      "whyChoose.process.step4.title": "Disfruta el resultado",
      "whyChoose.process.step4.desc":
        "Completamos el trabajo buscando tu satisfacción",

      "gallery.heading": "Mira la diferencia que logramos",
      "gallery.subheading": "Desliza para ver nuestras transformaciones",
      "gallery.moreHeading": "Más de nuestro trabajo",
      "gallery.card1.title": "Trabajo de árboles cerca de casas",
      "gallery.card1.subtitle": "Equipo del condado de DeKalb",
      "gallery.card2.title": "Césped recién terminado",
      "gallery.card2.subtitle": "Casa cerca de Cortland",
      "gallery.card3.title": "Limpieza de patio",
      "gallery.card3.subtitle": "Trabajo en el norte de Illinois",
      "gallery.latestHeading": "Últimas fotos subidas",
      "gallery.placeholder":
        "Tus nuevas fotos aparecerán aquí después de subirlas.",
      "gallery.facebookCta": "Ver más en Facebook",
      "gallery.item.front_yard": "Jardín delantero espectacular",
      "gallery.item.landscaper": "Cuidado experto",
      "gallery.item.modern_design": "Diseño moderno",
      "gallery.item.tree_service": "Cuidado profesional de árboles",
      "gallery.item.stone_work": "Adoquines hermosos",
      "gallery.item.lawn_care": "Céspedes impecables",
      "gallery.item.fire_pit": "Césped terminado y fogatero",
      "gallery.item.side_yard": "Acabado fresco del patio lateral",
      "gallery.item.mulch_edging": "Mantillo y bordes definidos",
      "gallery.item.brush_removal": "Retiro de ramas y maleza",
      "gallery.item.woodpile_cleanup": "Limpieza de patio y leña",
      "gallery.item.backyard_finish": "Acabado del césped trasero",
      "gallery.item.crew_equipment": "Equipo identificado de la cuadrilla",
      "gallery.item.canopy_work": "Trabajo en la copa del árbol",
      "gallery.item.removal_cleanup": "Limpieza después del retiro",
      "gallery.item.brush_clearing": "Limpieza de maleza y ramas",
      "gallery.item.roofline_work": "Trabajo de árboles cerca del techo",
      "gallery.item.residential_tree": "Cuidado de árboles residenciales",
      "gallery.item.finished_yard": "Trabajo de patio terminado",
      "gallery.item.outdoor_revival": "Renovación del espacio exterior",
      "gallery.item.yard_transformation": "Transformación del jardín",
      "gallery.item.precision_edging": "Bordes precisos",
      "gallery.item.hedge_trimming": "Recorte de setos",
      "gallery.page.title": "Fotos recientes de jardinería y árboles",
      "gallery.page.subtitle":
        "Mira resultados reales de Hernandez Landscape & Tree Service LLC en todo el condado de DeKalb.",
      "gallery.featured.eyebrow": "Transformación destacada",
      "gallery.featured.heading": "Desliza para comparar",
      "gallery.featured.instructions":
        "Arrastra el control o usa las flechas del teclado para comparar las fotos de antes y después.",
      "gallery.slider.value": "Divisor de comparación al {{value}}%",
      "gallery.slider.label": "Mostrar la foto del después",
      "nav.menuToggle": "Abrir o cerrar el menú móvil",
      "gallery.cta.heading": "¿Te inspiraste? Mejoremos tu jardín.",
      "gallery.cta.copy":
        "No tienes que vivir con un espacio exterior descuidado o difícil de mantener. Nosotros podemos encargarnos.",
      "gallery.cta.button": "Solicita una cotización gratis",
      "skip.gallery": "Saltar al contenido de la galería",
      "gallery.loading": "Cargando galería...",
      "gallery.error.configMissing":
        "Falta el archivo assets/js/firebase-config.js. Añádelo para cargar las fotos.",
      "gallery.error.firebase":
        "No se pudo cargar Firebase. Revisa tu conexión.",
      "gallery.error.generic":
        "No pudimos cargar las fotos en este momento. Intenta nuevamente.",
      "gallery.loadMore": "Cargar más fotos",
      "gallery.loadingButton": "Cargando...",

      "testimonials.heading": "Comentario destacado de un cliente",
      "testimonials.subheading":
        "Una reseña pública reciente del perfil del negocio en DeKalb, junto con los puntos que los dueños de casa suelen querer confirmar antes de contratar.",
      "testimonials.badge": "Reseña pública 5.0",
      "testimonials.reviewLabel": "Publicada el 19 de junio",
      "testimonials.reviewQuote":
        "Robert Tolito destacó que el equipo dejó su jardín muy bien cuidado, trabajó con eficiencia y puso atención a los detalles que pidió.",
      "testimonials.reviewAuthor": "Robert Tolito",
      "testimonials.reviewMeta":
        "Reseña pública asociada con la ficha de Hernandez Landscape en DeKalb.",
      "testimonials.reviewSource": "Ver la reseña original",
      "testimonials.supportTitle":
        "Lo que los dueños de casa quieren confirmar antes de llamar",
      "testimonials.support1":
        "Una respuesta clara sobre precio y siguientes pasos",
      "testimonials.support2":
        "Trabajo limpio y atención a los detalles en la propiedad",
      "testimonials.support3":
        "Comunicación bilingüe para agenda y actualizaciones",
      "testimonials.ctaEyebrow": "¿Listo para tu cotización?",
      "testimonials.ctaText":
        "Elige el servicio que necesitas y comparte los detalles de la propiedad. El equipo responde con el siguiente paso correcto, no con una respuesta genérica.",
      "testimonials.ctaButton": "Solicitar cotización",

      "serviceArea.heading": "Zonas en las que trabajamos",
      "serviceArea.subheading": "Orgullosos de servir al condado de DeKalb",
      "serviceArea.description":
        "Con base en DeKalb, ofrecemos servicios profesionales de jardinería y árboles en todo el condado. Respuesta rápida y precios competitivos para cada zona.",
      "serviceArea.primaryHeading": "Zonas principales:",
      "serviceArea.secondaryHeading": "También atendemos:",
      "serviceArea.info":
        "¿No estás seguro si cubrimos tu área? ¡Llámanos! Seguimos ampliando nuestra zona de servicio.",
      "serviceArea.mapPlaceholder": "Mapa interactivo muy pronto",
      "serviceArea.mapNote":
        "Haz zoom y explora nuestra base en DeKalb; atendemos todo el condado y comunidades cercanas.",
      "serviceArea.policyHeading":
        "<i class=\"fas fa-truck mr-2\" aria-hidden=\"true\"></i>Política de servicio",
      "serviceArea.policy1":
        "<strong>Zonas principales (DeKalb/Sycamore):</strong> Sin mínimo",
      "serviceArea.policy2":
        "<strong>Zonas alejadas (más de 20 minutos):</strong> Mínimo de 3 horas o $500",
      "serviceArea.policy3":
        "<strong>Trabajos en varias propiedades:</strong> Disponibles en cualquier zona con programación anticipada",
      "serviceArea.policy4":
        "<strong>Emergencias de nieve:</strong> Pregunta por disponibilidad en zonas alejadas",
      "serviceArea.policyNote":
        "Esto nos ayuda a mantener precios justos mientras cubrimos combustible y tiempo de traslado.",

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
      "quote.prefill.prefix": "Servicio seleccionado:",
      "quote.prefill.helper":
        "Agrega los detalles de tu propiedad abajo y el equipo podrá responder con el siguiente paso correcto.",
      "quote.formHelper":
        "Cuéntanos qué necesitas. Normalmente respondemos en menos de 24 horas y no hay ninguna obligación.",
      "quote.label.name": "Tu nombre",
      "quote.label.phone": "Número de teléfono",
      "quote.label.email": "Correo electrónico (opcional)",
      "quote.label.address": "Dirección de la propiedad",
      "quote.label.bestTime": "Mejor hora para llamar",
      "quote.label.service": "Servicio que necesitas",
      "quote.label.project": "Cuéntanos sobre tu proyecto",
      "quote.privacyNote":
        "Usamos tus datos únicamente para responder a esta solicitud.",
      "quote.placeholder.name": "Tu nombre",
      "quote.placeholder.phone": "Número de teléfono",
      "quote.title.phone": "Ingresa un número de 10 dígitos (ej., 8155011478)",
      "quote.placeholder.email": "Correo electrónico (opcional)",
      "quote.placeholder.address": "Dirección de la propiedad (requerida)",
      "quote.verify":
        "Soy el propietario o un representante autorizado y estaré presente para el estimado.",
      "quote.time.placeholder": "¿Cuál es la mejor hora para llamarte?",
      "quote.time.morning": "Mañana (8 a. m. - 12 p. m.)",
      "quote.time.afternoon": "Tarde (12 p. m. - 5 p. m.)",
      "quote.time.evening": "Noche (5 p. m. - 7 p. m.)",
      "quote.select.placeholder": "Selecciona el servicio requerido",
      "quote.select.lawn": "Cuidado del césped",
      "quote.select.tree": "Servicio de árboles",
      "quote.select.landscaping": "Paisajismo",
      "quote.select.snow": "Remoción de nieve",
      "quote.select.leaf": "Retiro de hojas",
      "quote.select.gutter": "Limpieza de canaletas",
      "quote.select.pressure": "Lavado a presión",
      "quote.select.multiple": "Múltiples servicios",
      "quote.placeholder.project": "Cuéntanos sobre tu proyecto...",
      "quote.submit": "Enviar solicitud de cotización",

      "footer.copy": "© 2026 Hernandez Landscape & Tree Service LLC",
      "footer.license": "Illinois LLC #13934835 • Licencia y seguro vigentes",
      "footer.tagline":
        "Servicios profesionales de jardinería en el condado de DeKalb",
      "footer.follow": "Síguenos",
      "footer.about":
        "Transformamos espacios exteriores en el condado de DeKalb con trabajo profesional y valores familiares desde 2019.",
      "footer.links": "Enlaces rápidos",
      "footer.contact": "Contáctanos",
      "footer.areas": "Zonas de servicio",
      "footer.rights": "Todos los derechos reservados.",
      "footer.insured": "Licencia y seguro vigentes",
      "footer.authorization": "Autorización #13934835",
      "header.license": "Licencia y seguro vigentes • LLC #13934835",
      "footer.facebook": "Facebook",
      "footer.maps": "Google Maps",
      "footer.privacy": "Política de privacidad",
      "footer.terms": "Términos de servicio",

      "modal.close": "Cerrar",
      "modal.call": "Llama al (815) 501-1478",

      "alerts.instant.missing":
        "Selecciona un tipo de servicio, tamaño de propiedad e ingresa tu código postal.",
      "alerts.contact.invalid":
        "Completa todos los campos requeridos correctamente.",
      "alerts.contact.success":
        "¡Gracias por tu interés! Te llamaremos en un plazo de 24 horas.",
      "alerts.contact.error":
        "Hubo un error al enviar tu solicitud. Llámanos al 815-501-1478.",
      "contact.sending": "Enviando...",
      "instant.handoff.prefix": "Solicitud de presupuesto instantáneo:",
      "instant.handoff.range": "Rango estimado:",

      "video.heading": "Recorridos en Video de Proyectos",
      "video.subheading":
        "Vea a nuestro equipo en acción y observe los detalles de nuestro trabajo.",
      "video.viewAll": "Ver Todos los Videos",
      "video.control.label": "Video del proyecto de Hernandez Landscape {{number}}",
      "video.page.title": "Recorridos en video de proyectos",
      "video.page.subtitle":
        "Mira a nuestro equipo en acción y conoce de cerca la calidad de nuestro trabajo.",
      "video.cta.estimate": "Solicita tu estimado gratis",
      "skip.main": "Saltar al contenido principal",

      "gallery.recent.heading": "Proyectos Recientes",
      "gallery.item.project": "Proyecto",

      "hero.eyebrow": "Jardinería y servicio de árboles en DeKalb County",
      "hero.transform": "Remoción de árboles, césped y",
      "hero.outdoor": "jardinería en DeKalb, IL",
      "hero.subtitle":
        "Poda, remoción de árboles, cuidado del césped y jardinería por un equipo familiar del condado de DeKalb. Estimados gratis en inglés o español.",
      "hero.emergency":
        "¿Daños por tormenta? Servicio de árboles de emergencia 24/7",
      "hero.emergencyCall": "Llama al (815) 501-1478",
      "hero.cta": "Ver rango inicial",
      "hero.call": "Llámanos ahora",
      "hero.insured": "Totalmente asegurados",
      "hero.licensed": "LLC con licencia",
      "hero.family": "Negocio familiar",
      "hero.bilingual": "Se Habla Español",
      "services.learnMore": "Más información",
      "pricing.heading": "Cotizaciones de paisajismo a tu medida",
      "pricing.copy":
        "Cada jardín, proyecto y temporada es diferente. Preparamos un estimado según tu propiedad y tus objetivos para que pagues solo por lo que necesitas.",
      "pricing.cta": "Solicitar una cotización personalizada",
      "faq.heading": "Preguntas frecuentes",
      "faq.q1": "¿Ofrecen estimados gratis para remover árboles en DeKalb?",
      "faq.a1":
        "Sí. Ofrecemos estimados gratis y sin compromiso para remoción y poda de árboles, además de proyectos de paisajismo en el condado de DeKalb y zonas cercanas.",
      "faq.q2": "¿Hernandez Landscape & Tree Service tiene licencia y seguro?",
      "faq.a2":
        "Sí. Somos una LLC con licencia y seguro vigentes (autorización #13934835) para proteger tu propiedad durante el trabajo de árboles y paisajismo.",
      "faq.q3": "¿Qué zonas atienden fuera de DeKalb?",
      "faq.a3":
        "Nuestras zonas principales son DeKalb y Sycamore. También atendemos Cortland, Malta, Genoa, Kingston, Rochelle, Hinckley, St. Charles y West Chicago.",
      "faq.q4": "¿Ofrecen remoción de árboles de emergencia?",
      "faq.a4":
        "Sí. Ofrecemos servicio de árboles de emergencia 24/7 para árboles caídos o peligrosos que amenacen de inmediato tu casa o propiedad.",
      "faq.q5": "¿Ofrecen remoción de nieve para propiedades residenciales?",
      "faq.a5":
        "Sí. Ofrecemos remoción de nieve estacional para propiedades residenciales y comerciales en el área de DeKalb, según disponibilidad.",
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

  function clearLegacyLanguagePreference() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore storage access errors so language setup still works.
    }
  }

  function getSessionLanguagePreference() {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function setSessionLanguagePreference(lang) {
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn("Unable to persist language preference.", error);
    }
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

    document
      .querySelectorAll("[data-i18n-aria-label]")
      .forEach((element) => {
        if (!element.dataset.ariaLabelEn) {
          element.dataset.ariaLabelEn = element.getAttribute("aria-label") || "";
        }
        const key = element.dataset.i18nAriaLabel;
        const translation = getTranslation(key, lang);
        const value =
          lang === "es" && translation
            ? translation
            : element.dataset.ariaLabelEn;
        if (value) {
          element.setAttribute("aria-label", value);
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

    setSessionLanguagePreference(targetLang);

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
    clearLegacyLanguagePreference();
    const savedLanguage = getSessionLanguagePreference();
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
