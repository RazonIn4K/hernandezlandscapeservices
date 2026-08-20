(() => {
  const languageToggle = document.getElementById('languageToggle');
  const saveContactButton = document.getElementById('saveContactButton');
  const shareButton = document.getElementById('shareButton');
  const manualShare = document.getElementById('manualShare');
  const manualShareUrl = document.getElementById('manualShareUrl');
  const toast = document.getElementById('toast');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentLanguage = 'en';
  let toastTimer;

  const copy = {
    en: {
      contactSaved: 'Contact card downloaded.',
      linkCopied: 'Page link copied.',
      copyUnavailable: 'Automatic copying is unavailable. Copy the selected link manually.',
      shareTitle: 'Hernandez Landscape & Tree Service LLC',
      shareText: 'Tree service, lawn care, and landscaping in DeKalb County.',
    },
    es: {
      contactSaved: 'Contacto descargado.',
      linkCopied: 'Enlace copiado.',
      copyUnavailable: 'No se pudo copiar automáticamente. Copie el enlace seleccionado manualmente.',
      shareTitle: 'Hernandez Landscape & Tree Service LLC',
      shareText: 'Servicio de árboles, césped y jardinería en el Condado de DeKalb.',
    },
  };

  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  const setLanguage = (language) => {
    currentLanguage = language;
    document.documentElement.lang = language;
    languageToggle.setAttribute('aria-pressed', String(language === 'es'));

    for (const element of document.querySelectorAll(`[data-${language}]`)) {
      element.innerHTML = element.getAttribute(`data-${language}`);
    }
    for (const link of document.querySelectorAll(`[data-href-${language}]`)) {
      link.setAttribute('href', link.getAttribute(`data-href-${language}`));
    }

    try {
      window.localStorage.setItem('hernandez-card-language', language);
    } catch {
      // Language persistence is optional when storage is unavailable.
    }
  };

  const saveContact = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Hernandez Landscape & Tree Service LLC',
      'ORG:Hernandez Landscape & Tree Service LLC',
      'TEL;TYPE=CELL,VOICE:+18155011478',
      'URL:https://hernandezlandscapeservices.com/',
      'ADR;TYPE=WORK:;;1029 Lewis St;DeKalb;IL;60115;USA',
      'NOTE:Tree service, lawn care, landscaping, and seasonal cleanup. English and Spanish.',
      'END:VCARD',
    ].join('\r\n');
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Hernandez-Landscape.vcf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast(copy[currentLanguage].contactSaved);
  };

  const sharePage = async () => {
    const shareData = {
      title: copy[currentLanguage].shareTitle,
      text: copy[currentLanguage].shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(copy[currentLanguage].linkCopied);
    } catch {
      const temporaryInput = document.createElement('input');
      temporaryInput.value = window.location.href;
      temporaryInput.setAttribute('readonly', '');
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch {
        // Older copy APIs can also be unavailable or denied.
      } finally {
        temporaryInput.remove();
      }
      if (copied) {
        showToast(copy[currentLanguage].linkCopied);
      } else {
        manualShare.hidden = false;
        manualShareUrl.value = window.location.href;
        manualShareUrl.focus();
        manualShareUrl.select();
        showToast(copy[currentLanguage].copyUnavailable);
      }
    }
  };

  languageToggle?.addEventListener('click', () => {
    setLanguage(currentLanguage === 'en' ? 'es' : 'en');
  });
  saveContactButton?.addEventListener('click', saveContact);
  shareButton?.addEventListener('click', sharePage);
  document.getElementById('closeManualShare')?.addEventListener('click', () => {
    manualShare.hidden = true;
    shareButton.focus();
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  let storedLanguage = 'en';
  try {
    storedLanguage = window.localStorage.getItem('hernandez-card-language') || 'en';
  } catch {
    storedLanguage = 'en';
  }
  setLanguage(storedLanguage === 'es' ? 'es' : 'en');
})();
