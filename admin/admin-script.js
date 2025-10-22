'use strict';

if (typeof firebase === 'undefined') {
  throw new Error('Firebase SDK failed to load.');
}

if (typeof window.firebaseConfig === 'undefined') {
  console.error('Missing firebaseConfig. Create admin/firebase-config.js based on admin/firebase-config.sample.js.');
}

const firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();

const ALLOWED_UPLOADERS = new Set(['+18155011478', '+13316451372']);

const authSection = document.getElementById('auth-section');
const phoneForm = document.getElementById('phone-form');
const phoneInput = document.getElementById('phone-number');
const codeForm = document.getElementById('code-form');
const codeInput = document.getElementById('verification-code');
const sendCodeButton = document.getElementById('send-code-btn');
const verifyCodeButton = document.getElementById('verify-code-btn');
const authMessage = document.getElementById('auth-message');

const uploadSection = document.getElementById('upload-section');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadStatus = document.getElementById('upload-status');
const logoutButton = document.getElementById('logout-button');

let confirmationResult = null;
let recaptchaVerifier = null;
let recaptchaWidgetId = null;

function setAuthMessage(message, type = '') {
  authMessage.textContent = message;
  authMessage.classList.remove('admin-message--error', 'admin-message--success');
  if (type) {
    authMessage.classList.add(type);
  }
}

function resetForms() {
  phoneInput.value = '';
  codeInput.value = '';
  codeForm.classList.add('hidden');
  sendCodeButton.disabled = false;
  verifyCodeButton.disabled = false;
  confirmationResult = null;
}

function ensureRecaptcha() {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
  });

  recaptchaVerifier.render().then((widgetId) => {
    recaptchaWidgetId = widgetId;
  }).catch((error) => {
    console.error('reCAPTCHA render error:', error);
  });

  return recaptchaVerifier;
}

function resetRecaptcha() {
  if (recaptchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
    grecaptcha.reset(recaptchaWidgetId);
  }
}

function normalizePhoneInput(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('+')) {
    const digits = '+' + trimmed.slice(1).replace(/[^0-9]/g, '');
    return digits.length > 1 ? digits : '';
  }

  const digitsOnly = trimmed.replace(/[^0-9]/g, '');
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  return '';
}

phoneForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const normalizedPhone = normalizePhoneInput(phoneInput.value);
  if (!normalizedPhone) {
    setAuthMessage('Introduce un número válido. Ejemplo: 8155551234 o +18155551234.', 'admin-message--error');
    return;
  }

  sendCodeButton.disabled = true;
  setAuthMessage('Enviando código por SMS...', '');

  resetRecaptcha();
  const verifier = ensureRecaptcha();

  phoneInput.value = normalizedPhone;

  auth.signInWithPhoneNumber(normalizedPhone, verifier)
    .then((result) => {
      confirmationResult = result;
      codeForm.classList.remove('hidden');
      setAuthMessage('Código enviado. Revisa tu teléfono e ingrésalo abajo.', 'admin-message--success');
    })
    .catch((error) => {
      console.error('SMS error:', error);
      setAuthMessage('No pudimos enviar el SMS. Verifica el número o inténtalo más tarde.', 'admin-message--error');
    })
    .finally(() => {
      sendCodeButton.disabled = false;
    });
});

codeForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!confirmationResult) {
    setAuthMessage('Solicita un nuevo código antes de confirmar.', 'admin-message--error');
    return;
  }

  const code = codeInput.value.trim();
  if (!code) {
    setAuthMessage('Ingresa el código de 6 dígitos recibido por SMS.', 'admin-message--error');
    return;
  }

  verifyCodeButton.disabled = true;
  setAuthMessage('Verificando código...', '');

  confirmationResult.confirm(code)
    .then(() => {
      setAuthMessage('Sesión iniciada. ¡Listo para subir fotos!', 'admin-message--success');
      codeForm.classList.add('hidden');
    })
    .catch((error) => {
      console.error('Código inválido:', error);
      setAuthMessage('Código incorrecto o vencido. Solicita uno nuevo.', 'admin-message--error');
    })
    .finally(() => {
      verifyCodeButton.disabled = false;
    });
});

logoutButton.addEventListener('click', () => {
  auth.signOut().catch((error) => {
    console.error('Error al cerrar sesión:', error);
  });
});

auth.onAuthStateChanged((user) => {
  if (user) {
    const phone = user.phoneNumber || '';
    if (ALLOWED_UPLOADERS.has(phone)) {
      authSection.classList.add('hidden');
      uploadSection.classList.remove('hidden');
      setAuthMessage('');
      return;
    }

    setAuthMessage('Este número no tiene permiso para subir fotos.', 'admin-message--error');
    auth.signOut().catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  authSection.classList.remove('hidden');
  uploadSection.classList.add('hidden');
  resetForms();
  uploadStatus.textContent = '';
  uploadStatus.classList.remove('admin-message--error', 'admin-message--success');
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.textContent = '0%';
});

uploadButton.addEventListener('click', () => {
  const files = Array.from(fileInput.files || []);
  if (!files.length) {
    uploadStatus.textContent = 'Selecciona al menos una imagen.';
    uploadStatus.classList.add('admin-message--error');
    return;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const transferredByFile = new Map();
  let completedUploads = 0;
  let hasFailed = false;

  uploadStatus.textContent = 'Subiendo fotos...';
  uploadStatus.classList.remove('admin-message--error', 'admin-message--success');
  uploadButton.disabled = true;

  const updateProgress = () => {
    const totalTransferred = Array.from(transferredByFile.values()).reduce((sum, value) => sum + value, 0);
    const percentage = totalBytes ? Math.min(100, Math.round((totalTransferred / totalBytes) * 100)) : 0;
    uploadProgressBar.style.width = `${percentage}%`;
    uploadProgressBar.textContent = `${percentage}%`;
  };

  files.forEach((file) => {
    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const storageRef = storage.ref(`gallery-images/${uniqueName}`);
    const uploadTask = storageRef.put(file);

    transferredByFile.set(file.name, 0);

    uploadTask.on('state_changed',
      (snapshot) => {
        transferredByFile.set(file.name, snapshot.bytesTransferred);
        updateProgress();
      },
      (error) => {
        console.error('Error subiendo archivo:', error);
        hasFailed = true;
        uploadStatus.textContent = 'Ocurrió un problema con algunas imágenes. Intenta de nuevo.';
        uploadStatus.classList.add('admin-message--error');
        uploadButton.disabled = false;
      },
      () => {
        completedUploads += 1;
        transferredByFile.set(file.name, file.size);
        updateProgress();

        if (completedUploads === files.length && !hasFailed) {
          uploadStatus.textContent = '¡Listo! Las fotos ya están en la galería.';
          uploadStatus.classList.add('admin-message--success');
          fileInput.value = '';
          uploadButton.disabled = false;
        }
      }
    );
  });
});
