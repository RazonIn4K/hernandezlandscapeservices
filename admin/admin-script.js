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

function normalizeToE164(value) {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();

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

const allowedNumbersConfig = Array.isArray(window.allowedUploaders) ? window.allowedUploaders : [];
const normalizedAllowed = allowedNumbersConfig.map(normalizeToE164).filter(Boolean);
const ALLOWED_UPLOADERS = normalizedAllowed.length ? new Set(normalizedAllowed) : null;

const siteI18n = typeof window.siteI18n === 'object' ? window.siteI18n : null;

const phoneAuthConfig =
  typeof window.firebasePhoneAuthConfig === 'object' ? window.firebasePhoneAuthConfig : {};
const disableRecaptcha = phoneAuthConfig.disableRecaptcha === true;

if (disableRecaptcha) {
  console.warn('Firebase Phone Auth: reCAPTCHA disabled (testing mode enabled). Only use this in trusted environments.');
}

if (disableRecaptcha && auth.settings) {
  try {
    auth.settings.appVerificationDisabledForTesting = true;
  } catch (error) {
    console.warn('Unable to disable app verification. reCAPTCHA may still be required.', error);
  }
}

const bypassVerifier = disableRecaptcha
  ? {
      type: 'recaptcha',
      verify: () => Promise.resolve('recaptcha-disabled'),
    }
  : null;

if (disableRecaptcha) {
  console.warn(
    'reCAPTCHA requirement is disabled. Only use this mode in trusted environments.'
  );
}

function getMessage(key, fallback, replacements = {}) {
  let template = '';
  if (siteI18n && typeof siteI18n.t === 'function') {
    try {
      template = siteI18n.t(key);
    } catch (error) {
      template = '';
    }
  }
  if (!template) {
    template = fallback;
  }
  if (!template) {
    return '';
  }
  return Object.entries(replacements).reduce((result, [placeholder, value]) => {
    const pattern = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
    return result.replace(pattern, value);
  }, template);
}

function pluralKey(baseKey, count) {
  return count === 1 ? `${baseKey}.one` : `${baseKey}.other`;
}

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
const dropZone = document.getElementById('file-dropzone');
const addPhotosButton = document.getElementById('add-photos-button');
const selectedFilesList = document.getElementById('selected-files');
const logoutButton = document.getElementById('logout-button');

let confirmationResult = null;
let recaptchaVerifier = null;
let recaptchaWidgetId = null;
let selectedFiles = [];

function setAuthMessage(message, type = '') {
  authMessage.textContent = message;
  authMessage.classList.remove('admin-message--error', 'admin-message--success');
  if (type) {
    authMessage.classList.add(type);
  }
}

function setUploadMessage(message, type = '') {
  uploadStatus.textContent = message;
  uploadStatus.classList.remove('admin-message--error', 'admin-message--success');
  if (type) {
    uploadStatus.classList.add(type);
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

function resetRecaptcha() {
  if (disableRecaptcha) {
    return;
  }

  if (recaptchaWidgetId !== null && window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
    try {
      window.grecaptcha.reset(recaptchaWidgetId);
    } catch (error) {
      console.warn('Unable to reset reCAPTCHA widget.', error);
    }
  }

  if (recaptchaVerifier && typeof recaptchaVerifier.clear === 'function') {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      console.warn('Unable to clear reCAPTCHA verifier.', error);
    }
  }

  recaptchaVerifier = null;
  recaptchaWidgetId = null;
}

function ensureRecaptcha() {
  if (disableRecaptcha && bypassVerifier) {
    return bypassVerifier;
  }

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


function formatBytes(bytes) {
  if (!bytes) {
    return '0 KB';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function renderSelectedFiles() {
  selectedFilesList.innerHTML = '';

  if (!selectedFiles.length) {
    const emptyMessage = getMessage('admin.file.empty', 'No photos selected yet.');
    selectedFilesList.innerHTML = `<li class="admin-file-item empty">${emptyMessage}</li>`;
    return;
  }

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('li');
    item.className = 'admin-file-item';

    const info = document.createElement('div');
    info.className = 'admin-file-name';
    info.innerHTML = `<span>${file.name}</span><span class="admin-file-size">${formatBytes(file.size)}</span>`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'admin-file-remove';
    removeButton.textContent = getMessage('admin.file.remove', 'Remove');
    removeButton.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderSelectedFiles();
    });

    item.appendChild(info);
    item.appendChild(removeButton);
    selectedFilesList.appendChild(item);
  });
}

function clearSelectedFiles() {
  selectedFiles = [];
  renderSelectedFiles();
}

function addImagesToSelection(fileList) {
  const files = Array.from(fileList || []);
  let added = 0;
  let duplicates = 0;
  let skipped = 0;

  files.forEach((file) => {
    if (!file.type.startsWith('image/')) {
      skipped += 1;
      return;
    }

    const signature = `${file.name}-${file.size}-${file.lastModified}`;
    const alreadyExists = selectedFiles.some((existing) => `${existing.name}-${existing.size}-${existing.lastModified}` === signature);
    if (alreadyExists) {
      duplicates += 1;
      return;
    }

    selectedFiles.push(file);
    added += 1;
  });

  renderSelectedFiles();
  return { added, duplicates, skipped };
}

phoneForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const normalizedPhone = normalizeToE164(phoneInput.value);
  if (!normalizedPhone) {
    setAuthMessage(
      getMessage(
        'admin.message.invalidPhone',
        'Enter a valid phone number. Example: 8155551234 or +18155551234.'
      ),
      'admin-message--error'
    );
    return;
  }

  sendCodeButton.disabled = true;
  setAuthMessage(getMessage('admin.message.sendingCode', 'Sending SMS code...'), '');

  resetRecaptcha();
  const verifier = ensureRecaptcha();

  phoneInput.value = normalizedPhone;

  auth.signInWithPhoneNumber(normalizedPhone, verifier)
    .then((result) => {
      confirmationResult = result;
      codeForm.classList.remove('hidden');
      setAuthMessage(
        getMessage('admin.message.codeSent', 'Code sent. Check your phone and enter it below.'),
        'admin-message--success'
      );
    })
    .catch((error) => {
      console.error('SMS error:', error);
      setAuthMessage(
        getMessage(
          'admin.message.smsError',
          'We could not send the SMS. Check the number or try again later.'
        ),
        'admin-message--error'
      );
    })
    .finally(() => {
      sendCodeButton.disabled = false;
    });
});

codeForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!confirmationResult) {
    setAuthMessage(
      getMessage('admin.message.requestCodeFirst', 'Request a new code before confirming.'),
      'admin-message--error'
    );
    return;
  }

  const code = codeInput.value.trim();
  if (!code) {
    setAuthMessage(
      getMessage('admin.message.enterCode', 'Enter the 6-digit code you received via SMS.'),
      'admin-message--error'
    );
    return;
  }

  verifyCodeButton.disabled = true;
  setAuthMessage(getMessage('admin.message.verifying', 'Verifying code...'), '');

  confirmationResult.confirm(code)
    .then(() => {
      setAuthMessage(
        getMessage('admin.message.loginSuccess', 'Signed in. Ready to upload photos!'),
        'admin-message--success'
      );
      codeForm.classList.add('hidden');
    })
    .catch((error) => {
      console.error('Invalid verification code:', error);
      setAuthMessage(
        getMessage('admin.message.invalidCode', 'Incorrect or expired code. Request a new one.'),
        'admin-message--error'
      );
    })
    .finally(() => {
      verifyCodeButton.disabled = false;
    });
});

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    clearSelectedFiles();
    setUploadMessage('');
    uploadProgressBar.style.width = '0%';
    uploadProgressBar.textContent = '0%';
    auth.signOut().catch((error) => {
      console.error('Error signing out:', error);
    });
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    const phone = normalizeToE164(user.phoneNumber);
    if (!ALLOWED_UPLOADERS || ALLOWED_UPLOADERS.has(phone)) {
      authSection.classList.add('hidden');
      uploadSection.classList.remove('hidden');
      setAuthMessage('');
      return;
    }

    setAuthMessage(
      getMessage('admin.message.notAllowed', 'This number is not allowed to upload photos.'),
      'admin-message--error'
    );
    auth.signOut().catch((error) => {
      console.error('Error signing out:', error);
    });
  }

  authSection.classList.remove('hidden');
  uploadSection.classList.add('hidden');
  resetForms();
  clearSelectedFiles();
  setUploadMessage('');
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.textContent = '0%';
});

renderSelectedFiles();
setUploadMessage('');

if (addPhotosButton) {
  addPhotosButton.addEventListener('click', () => fileInput.click());
}

if (dropZone) {
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach((type) => {
    dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((type) => {
    dropZone.addEventListener(type, () => {
      dropZone.classList.remove('is-dragover');
    });
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
      const { added, duplicates, skipped } = addImagesToSelection(event.dataTransfer.files);
      if (added) {
        const key = pluralKey('admin.message.filesAdded', added);
        const fallback =
          added === 1
            ? 'Added 1 photo to the upload list.'
            : `Added ${added} photos to the upload list.`;
        setUploadMessage(
          getMessage(key, fallback, { count: String(added) }),
          'admin-message--success'
        );
      } else if (duplicates) {
        setUploadMessage(
          getMessage('admin.message.duplicates', 'Those images were already on the list.'),
          'admin-message--error'
        );
      } else if (skipped) {
        setUploadMessage(
          getMessage('admin.message.skipped', 'Only image files are allowed.'),
          'admin-message--error'
        );
      }
    }
  });
}

fileInput.addEventListener('change', (event) => {
  if (!event.target.files || !event.target.files.length) {
    return;
  }

  const { added, duplicates, skipped } = addImagesToSelection(event.target.files);
  if (added) {
    const key = pluralKey('admin.message.filesAdded', added);
    const fallback =
      added === 1
        ? 'Added 1 photo to the upload list.'
        : `Added ${added} photos to the upload list.`;
    setUploadMessage(
      getMessage(key, fallback, { count: String(added) }),
      'admin-message--success'
    );
  } else if (duplicates) {
    setUploadMessage(
      getMessage('admin.message.duplicates', 'Those images were already on the list.'),
      'admin-message--error'
    );
  } else if (skipped) {
    setUploadMessage(
      getMessage('admin.message.skipped', 'Only image files are allowed.'),
      'admin-message--error'
    );
  }
  fileInput.value = '';
});

uploadButton.addEventListener('click', () => {
  const files = selectedFiles.slice();
  if (!files.length) {
    setUploadMessage(
      getMessage('admin.message.selectImage', 'Select at least one image.'),
      'admin-message--error'
    );
    return;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const transferredByFile = new Map();
  let hasFailed = false;
  const failedFiles = [];

  setUploadMessage(getMessage('admin.message.uploading', 'Uploading photos...'));
  uploadButton.disabled = true;
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.textContent = '0%';

  const updateProgress = () => {
    const totalTransferred = Array.from(transferredByFile.values()).reduce((sum, value) => sum + value, 0);
    const percentage = totalBytes ? Math.min(100, Math.round((totalTransferred / totalBytes) * 100)) : 0;
    uploadProgressBar.style.width = `${percentage}%`;
    uploadProgressBar.textContent = `${percentage}%`;
  };

  const uploadTasks = files.map((file, index) => new Promise((resolve) => {
    const uniqueName = `${Date.now()}-${index}-${file.name.replace(/\s+/g, '-')}`;
    const storageRef = storage.ref(`gallery-images/${uniqueName}`);
    const uploadTask = storageRef.put(file);

    transferredByFile.set(uniqueName, 0);

    uploadTask.on('state_changed',
      (snapshot) => {
        transferredByFile.set(uniqueName, snapshot.bytesTransferred);
        updateProgress();
      },
      (error) => {
        console.error('Error uploading file:', error);
        hasFailed = true;
        failedFiles.push({ name: file.name, error });
        resolve({ status: 'rejected', reason: error });
      },
      () => {
        transferredByFile.set(uniqueName, file.size);
        updateProgress();
        resolve({ status: 'fulfilled' });
      }
    );
  }));

  Promise.allSettled(uploadTasks).then((results) => {
    uploadButton.disabled = false;

    if (hasFailed) {
      const failedList = failedFiles.map((item) => item.name).join(', ');
      if (failedList) {
        setUploadMessage(
          getMessage(
            'admin.message.uploadFailedList',
            `We could not upload these images: ${failedList}.`,
            { list: failedList }
          ),
          'admin-message--error'
        );
      } else {
        setUploadMessage(
          getMessage(
            'admin.message.uploadFailedGeneric',
            'Something went wrong with some images. Please try again.'
          ),
          'admin-message--error'
        );
      }
      return;
    }

    const hasSuccess = results.some((result) => result.status === 'fulfilled');
    if (hasSuccess) {
      setUploadMessage(
        getMessage('admin.message.uploadSuccess', 'All set! Your photos are now in the gallery.'),
        'admin-message--success'
      );
      clearSelectedFiles();
      uploadProgressBar.style.width = '0%';
      uploadProgressBar.textContent = '0%';
    } else {
      setUploadMessage(
        getMessage('admin.message.noUploads', 'No images were uploaded.'),
        'admin-message--error'
      );
    }
  });
});
