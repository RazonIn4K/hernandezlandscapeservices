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
const firestore = firebase.firestore();
const galleryCollection = firestore.collection('media');

const MEDIA_STORAGE_PATH = 'media';
const THUMBNAIL_STORAGE_PATH = 'thumbnails';
const MAX_IMAGE_THUMBNAIL_EDGE = 1280;
const VIDEO_THUMBNAIL_CAPTURE_TIME = 0.1;

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
const publishToggle = document.getElementById('publish-toggle');
const mediaManagerSection = document.getElementById('media-manager');
const mediaListElement = document.getElementById('media-list');
const mediaEmptyState = document.getElementById('media-empty');
const mediaFilterSelect = document.getElementById('media-filter');

let confirmationResult = null;
let recaptchaVerifier = null;
let recaptchaWidgetId = null;
let selectedItems = [];
let unsubscribeMedia = null;
let mediaEntries = [];

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
    size: 'normal'
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

function mediaCategoryFromType(type) {
  if (typeof type !== 'string') {
    return 'other';
  }
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type.startsWith('video/')) {
    return 'video';
  }
  return 'other';
}

function signatureForFile(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function slugifyFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'media';
}

function deriveDefaultTitle(fileName, mediaCategory) {
  const base = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  if (base) {
    return base;
  }
  return mediaCategory === 'video' ? 'Video clip' : 'Project photo';
}

function createItemRecord(file) {
  const type = file.type || 'application/octet-stream';
  const mediaCategory = mediaCategoryFromType(type);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    signature: signatureForFile(file),
    type,
    mediaCategory,
    title: '',
    description: '',
    width: null,
    height: null,
    duration: null,
    thumbnailBlob: null,
    thumbnailExtension: 'jpg',
  };
}

function renderSelectedFiles() {
  selectedFilesList.innerHTML = '';

  if (!selectedItems.length) {
    const emptyMessage = getMessage('admin.file.empty', 'No media selected yet.');
    selectedFilesList.innerHTML = `<li class="admin-file-item empty">${emptyMessage}</li>`;
    return;
  }

  selectedItems.forEach((record, index) => {
    const item = document.createElement('li');
    item.className = 'admin-file-item';

    const header = document.createElement('div');
    header.className = 'admin-file-top';

    const info = document.createElement('div');
    info.className = 'admin-file-name';
    info.innerHTML = `<span>${record.file.name}</span><span class="admin-file-size">${formatBytes(record.file.size)}</span>`;

    const badge = document.createElement('span');
    badge.className = `admin-file-tag admin-file-tag--${record.mediaCategory}`;
    const badgeFallback = record.mediaCategory === 'video' ? 'Video' : 'Photo';
    badge.textContent = getMessage(`admin.file.type.${record.mediaCategory}`, badgeFallback);
    info.appendChild(badge);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'admin-file-remove';
    removeButton.textContent = getMessage('admin.file.remove', 'Remove');
    removeButton.addEventListener('click', () => {
      selectedItems.splice(index, 1);
      renderSelectedFiles();
    });

    header.appendChild(info);
    header.appendChild(removeButton);
    item.appendChild(header);

    const meta = document.createElement('div');
    meta.className = 'admin-file-meta';

    const titleField = document.createElement('label');
    titleField.className = 'admin-file-field';
    const titleLabel = document.createElement('span');
    titleLabel.className = 'admin-file-label';
    titleLabel.textContent = getMessage('admin.file.titleLabel', 'Title (optional)');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'admin-input admin-input--compact';
    titleInput.placeholder = getMessage('admin.file.titlePlaceholder', record.mediaCategory === 'video' ? 'Short clip title' : 'Project title');
    titleInput.value = record.title;
    titleInput.addEventListener('input', (event) => {
      record.title = event.target.value;
    });
    titleField.appendChild(titleLabel);
    titleField.appendChild(titleInput);

    const descriptionField = document.createElement('label');
    descriptionField.className = 'admin-file-field';
    const descriptionLabel = document.createElement('span');
    descriptionLabel.className = 'admin-file-label';
    descriptionLabel.textContent = getMessage('admin.file.descriptionLabel', 'Description (optional)');
    const descriptionInput = document.createElement('textarea');
    descriptionInput.className = 'admin-input admin-input--compact admin-input--textarea';
    descriptionInput.rows = 2;
    descriptionInput.placeholder = getMessage('admin.file.descriptionPlaceholder', 'Add a short note about this upload.');
    descriptionInput.value = record.description;
    descriptionInput.addEventListener('input', (event) => {
      record.description = event.target.value;
    });
    descriptionField.appendChild(descriptionLabel);
    descriptionField.appendChild(descriptionInput);

    meta.appendChild(titleField);
    meta.appendChild(descriptionField);
    item.appendChild(meta);

    selectedFilesList.appendChild(item);
  });
}

function clearSelectedFiles() {
  selectedItems = [];
  renderSelectedFiles();
  if (fileInput) {
    fileInput.value = '';
  }
  if (publishToggle) {
    publishToggle.checked = false;
  }
}

function addMediaToSelection(fileList) {
  const files = Array.from(fileList || []);
  let added = 0;
  let duplicates = 0;
  let skipped = 0;

  files.forEach((file) => {
    const mediaCategory = mediaCategoryFromType(file.type || '');
    if (mediaCategory === 'other') {
      skipped += 1;
      return;
    }

    const signature = signatureForFile(file);
    const alreadyExists = selectedItems.some((existing) => existing.signature === signature);
    if (alreadyExists) {
      duplicates += 1;
      return;
    }

    const record = createItemRecord(file);
    record.mediaCategory = mediaCategory;
    selectedItems.push(record);
    added += 1;
  });

  renderSelectedFiles();
  return { added, duplicates, skipped };
}

function generateImageThumbnail(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxEdge = Math.max(img.width, img.height);
        const scale = maxEdge > MAX_IMAGE_THUMBNAIL_EDGE
          ? MAX_IMAGE_THUMBNAIL_EDGE / maxEdge
          : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve({
            thumbnailBlob: blob,
            width: img.width,
            height: img.height,
            duration: null,
          });
        }, 'image/jpeg', 0.84);
      };
      img.onerror = () => reject(new Error('Unable to load image for thumbnail generation.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

function generateVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.addEventListener('error', () => {
      cleanup();
      reject(new Error('Unable to load video for thumbnail generation.'));
    });

    video.addEventListener('loadedmetadata', () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > VIDEO_THUMBNAIL_CAPTURE_TIME
        ? VIDEO_THUMBNAIL_CAPTURE_TIME
        : 0;
      try {
        video.currentTime = targetTime;
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    video.addEventListener('seeked', () => {
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;

      if (!width || !height) {
        cleanup();
        resolve({ thumbnailBlob: null, width, height, duration: video.duration || null });
        return;
      }

      const maxEdge = Math.max(width, height);
      const scale = maxEdge > MAX_IMAGE_THUMBNAIL_EDGE
        ? MAX_IMAGE_THUMBNAIL_EDGE / maxEdge
        : 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        cleanup();
        resolve({
          thumbnailBlob: blob,
          width,
          height,
          duration: Number.isFinite(video.duration) ? video.duration : null,
        });
      }, 'image/jpeg', 0.82);
    });

    video.src = url;
  });
}

function prepareMediaAsset(record) {
  if (record.mediaCategory === 'image') {
    return generateImageThumbnail(record.file).catch((error) => {
      console.warn('Image thumbnail generation failed:', error);
      return { thumbnailBlob: null, width: null, height: null, duration: null };
    });
  }
  if (record.mediaCategory === 'video') {
    return generateVideoThumbnail(record.file).catch((error) => {
      console.warn('Video thumbnail generation failed:', error);
      return { thumbnailBlob: null, width: null, height: null, duration: null };
    });
  }
  return Promise.resolve({ thumbnailBlob: null, width: null, height: null, duration: null });
}

function uploadWithProgress(storageRef, file, metadata, transferredByFile, updateProgress) {
  return new Promise((resolve, reject) => {
    const progressKey = storageRef.fullPath;
    transferredByFile.set(progressKey, 0);
    const uploadTask = storageRef.put(file, metadata);

    uploadTask.on('state_changed',
      (snapshot) => {
        transferredByFile.set(progressKey, snapshot.bytesTransferred);
        updateProgress();
      },
      (error) => {
        transferredByFile.delete(progressKey);
        updateProgress();
        reject(error);
      },
      () => {
        transferredByFile.set(progressKey, file.size);
        updateProgress();
        resolve();
      }
    );
  });
}

async function uploadMediaItem(record, index, transferredByFile, updateProgress) {
  const prepared = await prepareMediaAsset(record);
  const timestamp = Date.now();
  const baseSlug = slugifyFilename(record.file.name);
  const baseName = `${timestamp}-${index}-${baseSlug}`;
  const extensionMatch = record.file.name.lastIndexOf('.') > -1 ? record.file.name.slice(record.file.name.lastIndexOf('.') + 1) : '';
  const safeExtension = extensionMatch && extensionMatch.length <= 8 ? extensionMatch.toLowerCase() : (record.mediaCategory === 'video' ? 'mp4' : 'jpg');

  const mainPath = `${MEDIA_STORAGE_PATH}/${baseName}.${safeExtension}`;
  const storageRef = storage.ref(mainPath);
  const customMetadata = {
    mediaCategory: record.mediaCategory,
    originalName: record.file.name,
  };
  const user = auth.currentUser;
  const normalizedUploader = user ? normalizeToE164(user.phoneNumber) : null;
  if (normalizedUploader) {
    customMetadata.uploadedBy = normalizedUploader;
  }

  await uploadWithProgress(
    storageRef,
    record.file,
    { contentType: record.type, customMetadata },
    transferredByFile,
    updateProgress
  );

  const downloadURL = await storageRef.getDownloadURL();

  let thumbnailURL = null;
  let thumbnailPath = null;
  if (prepared.thumbnailBlob) {
    thumbnailPath = `${THUMBNAIL_STORAGE_PATH}/${baseName}.jpg`;
    const thumbRef = storage.ref(thumbnailPath);
    await thumbRef.put(prepared.thumbnailBlob, {
      contentType: 'image/jpeg',
      customMetadata,
    });
    thumbnailURL = await thumbRef.getDownloadURL();
  }

  const docPayload = {
    title: record.title.trim() || deriveDefaultTitle(record.file.name, record.mediaCategory),
    description: record.description.trim() || '',
    mediaCategory: record.mediaCategory,
    contentType: record.type,
    size: record.file.size,
    width: prepared.width,
    height: prepared.height,
    duration: prepared.duration,
    downloadURL,
    storagePath: mainPath,
    thumbnailURL: thumbnailURL || null,
    thumbnailPath,
    originalFileName: record.file.name,
    uploadedBy: normalizedUploader,
    published: Boolean(publishToggle && publishToggle.checked),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (!galleryCollection) {
    const error = new Error('Firestore collection not configured for gallery uploads.');
    error.fileName = record.file.name;
    throw error;
  }

  await galleryCollection.add(docPayload);
  return docPayload;
}

function toggleMediaManager(visible) {
  if (!mediaManagerSection) {
    return;
  }
  if (visible) {
    mediaManagerSection.classList.remove('hidden');
  } else {
    mediaManagerSection.classList.add('hidden');
  }
}

function detachMediaListener() {
  if (typeof unsubscribeMedia === 'function') {
    unsubscribeMedia();
    unsubscribeMedia = null;
  }
}

function mapDocToEntry(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: (data.title || '').trim() || deriveDefaultTitle(data.originalFileName || doc.id, data.mediaCategory || 'other'),
    description: (data.description || '').trim(),
    mediaCategory: data.mediaCategory || mediaCategoryFromType(data.contentType || ''),
    published: Boolean(data.published),
    downloadURL: data.downloadURL || '',
    thumbnailURL: data.thumbnailURL || '',
    storagePath: data.storagePath || '',
    thumbnailPath: data.thumbnailPath || '',
    createdAt: data.createdAt && typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : Date.now(),
    uploadedBy: data.uploadedBy || '',
  };
}

function renderMediaList() {
  if (!mediaListElement || !mediaEmptyState) {
    return;
  }

  const filterValue = mediaFilterSelect ? mediaFilterSelect.value : 'all';
  const filtered = mediaEntries.filter((entry) => {
    if (filterValue === 'photo') {
      return entry.mediaCategory === 'image';
    }
    if (filterValue === 'video') {
      return entry.mediaCategory === 'video';
    }
    if (filterValue === 'unpublished') {
      return !entry.published;
    }
    return true;
  });

  mediaListElement.innerHTML = '';

  if (!filtered.length) {
    mediaEmptyState.classList.remove('hidden');
    return;
  }

  mediaEmptyState.classList.add('hidden');

  filtered.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'admin-manager-item';

    const meta = document.createElement('div');
    meta.className = 'admin-manager-meta';

    const title = document.createElement('h3');
    title.textContent = entry.title;
    meta.appendChild(title);

    if (entry.description) {
      const description = document.createElement('p');
      description.className = 'text-sm text-gray-600';
      description.textContent = entry.description;
      meta.appendChild(description);
    }

    const tags = document.createElement('div');
    tags.className = 'admin-manager-tags';

    const typeTag = document.createElement('span');
    typeTag.className = `admin-tag ${entry.mediaCategory === 'video' ? 'admin-tag--video' : ''}`;
    typeTag.textContent = getMessage(
      entry.mediaCategory === 'video' ? 'admin.file.type.video' : 'admin.file.type.image',
      entry.mediaCategory === 'video' ? 'Video' : 'Photo'
    );
    tags.appendChild(typeTag);

    if (!entry.published) {
      const draftTag = document.createElement('span');
      draftTag.className = 'admin-tag admin-tag--draft';
      draftTag.textContent = getMessage('admin.manager.tag.draft', 'Unpublished');
      tags.appendChild(draftTag);
    }

    const createdDate = document.createElement('span');
    createdDate.className = 'admin-tag';
    createdDate.textContent = new Date(entry.createdAt).toLocaleString();
    tags.appendChild(createdDate);

    meta.appendChild(tags);

    const actions = document.createElement('div');
    actions.className = 'admin-manager-actions';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'admin-action-button admin-action-button--primary';
    toggleButton.textContent = entry.published
      ? getMessage('admin.manager.unpublish', 'Set as draft')
      : getMessage('admin.manager.publish', 'Publish');
    toggleButton.addEventListener('click', () => handlePublishChange(entry, !entry.published));
    actions.appendChild(toggleButton);

    const viewButton = document.createElement('a');
    viewButton.href = entry.downloadURL;
    viewButton.target = '_blank';
    viewButton.rel = 'noopener noreferrer';
    viewButton.className = 'admin-action-button admin-action-button--secondary';
    viewButton.textContent = getMessage('admin.manager.view', 'Open');
    actions.appendChild(viewButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'admin-action-button admin-action-button--danger';
    deleteButton.textContent = getMessage('admin.manager.delete', 'Delete');
    deleteButton.addEventListener('click', () => handleDeleteMedia(entry));
    actions.appendChild(deleteButton);

    item.appendChild(meta);
    item.appendChild(actions);
    mediaListElement.appendChild(item);
  });
}

function startMediaListener() {
  if (!galleryCollection) {
    return;
  }
  detachMediaListener();
  unsubscribeMedia = galleryCollection
    .orderBy('createdAt', 'desc')
    .limit(200)
    .onSnapshot(
      (snapshot) => {
        mediaEntries = snapshot.docs.map(mapDocToEntry);
        renderMediaList();
      },
      (error) => {
        console.error('Media listener error:', error);
        setUploadMessage(
          getMessage('admin.manager.errorLoad', 'Unable to load existing media items. Please refresh.'),
          'admin-message--error'
        );
      }
    );
}

function handlePublishChange(entry, shouldPublish) {
  if (!galleryCollection || !entry || !entry.id) {
    return;
  }
  galleryCollection.doc(entry.id)
    .update({
      published: shouldPublish,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      setUploadMessage(
        getMessage(
          shouldPublish ? 'admin.manager.publishSuccess' : 'admin.manager.unpublishSuccess',
          shouldPublish ? 'Item published.' : 'Item marked as draft.'
        ),
        'admin-message--success'
      );
    })
    .catch((error) => {
      console.error('Publish toggle failed:', error);
      setUploadMessage(
        getMessage('admin.manager.errorUpdate', 'Unable to update publish status. Try again.'),
        'admin-message--error'
      );
    });
}

function handleDeleteMedia(entry) {
  if (!galleryCollection || !entry || !entry.id) {
    return;
  }

  const confirmText = getMessage('admin.manager.confirmDelete', 'Delete this media item? This cannot be undone.');
  if (!window.confirm(confirmText)) {
    return;
  }

  const deleteOperations = [];
  if (entry.storagePath) {
    deleteOperations.push(storage.ref(entry.storagePath).delete().catch((error) => {
      console.warn('Failed to delete media file:', error);
    }));
  }
  if (entry.thumbnailPath) {
    deleteOperations.push(storage.ref(entry.thumbnailPath).delete().catch((error) => {
      console.warn('Failed to delete thumbnail:', error);
    }));
  }

  Promise.all(deleteOperations)
    .then(() => galleryCollection.doc(entry.id).delete())
    .then(() => {
      setUploadMessage(
        getMessage('admin.manager.deleteSuccess', 'Media item deleted.'),
        'admin-message--success'
      );
    })
    .catch((error) => {
      console.error('Delete failed:', error);
      setUploadMessage(
        getMessage('admin.manager.errorDelete', 'Unable to delete media item. Try again.'),
        'admin-message--error'
      );
    });
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
      toggleMediaManager(true);
      startMediaListener();
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
  toggleMediaManager(false);
  detachMediaListener();
  mediaEntries = [];
  renderMediaList();
});

renderSelectedFiles();
setUploadMessage('');
toggleMediaManager(false);
renderMediaList();

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
      const { added, duplicates, skipped } = addMediaToSelection(event.dataTransfer.files);
      if (added) {
        const key = pluralKey('admin.message.filesAdded', added);
        const fallback =
          added === 1
            ? 'Added 1 media item to the upload list.'
            : `Added ${added} media items to the upload list.`;
        setUploadMessage(
          getMessage(key, fallback, { count: String(added) }),
          'admin-message--success'
        );
      } else if (duplicates) {
        setUploadMessage(
          getMessage('admin.message.duplicates', 'Those files were already on the list.'),
          'admin-message--error'
        );
      } else if (skipped) {
        setUploadMessage(
          getMessage('admin.message.skipped', 'Only photo or video files are allowed.'),
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

  const { added, duplicates, skipped } = addMediaToSelection(event.target.files);
  if (added) {
    const key = pluralKey('admin.message.filesAdded', added);
    const fallback =
      added === 1
        ? 'Added 1 media item to the upload list.'
        : `Added ${added} media items to the upload list.`;
    setUploadMessage(
      getMessage(key, fallback, { count: String(added) }),
      'admin-message--success'
    );
  } else if (duplicates) {
    setUploadMessage(
        getMessage('admin.message.duplicates', 'Those files were already on the list.'),
      'admin-message--error'
    );
  } else if (skipped) {
    setUploadMessage(
        getMessage('admin.message.skipped', 'Only photo or video files are allowed.'),
      'admin-message--error'
    );
  }
  fileInput.value = '';
});

if (mediaFilterSelect) {
  mediaFilterSelect.addEventListener('change', () => renderMediaList());
}

uploadButton.addEventListener('click', () => {
  const items = selectedItems.slice();
  if (!items.length) {
    setUploadMessage(
      getMessage('admin.message.selectImage', 'Select at least one media file to upload.'),
      'admin-message--error'
    );
    return;
  }

  const totalBytes = items.reduce((sum, record) => sum + record.file.size, 0);
  const transferredByFile = new Map();
  let hasFailed = false;
  const failedFiles = [];

  setUploadMessage(getMessage('admin.message.uploading', 'Uploading your media...'));
  uploadButton.disabled = true;
  uploadProgressBar.style.width = '0%';
  uploadProgressBar.textContent = '0%';

  const updateProgress = () => {
    const totalTransferred = Array.from(transferredByFile.values()).reduce((sum, value) => sum + value, 0);
    const percentage = totalBytes ? Math.min(100, Math.round((totalTransferred / totalBytes) * 100)) : 0;
    uploadProgressBar.style.width = `${percentage}%`;
    uploadProgressBar.textContent = `${percentage}%`;
  };

  const uploads = items.map((record, index) =>
    uploadMediaItem(record, index, transferredByFile, updateProgress)
      .catch((error) => {
        hasFailed = true;
        if (error && !error.fileName) {
          try {
            error.fileName = record.file.name;
          } catch (assignError) {
            console.warn('Unable to annotate upload error with filename.', assignError);
          }
        }
        const failureName = (error && error.fileName) || record.file.name;
        failedFiles.push(failureName);
        throw error;
      })
  );

  Promise.allSettled(uploads)
    .then((results) => {
      uploadButton.disabled = false;

      if (hasFailed) {
        const failedList = failedFiles.join(', ');
        setUploadMessage(
          failedList
            ? getMessage(
                'admin.message.uploadFailedList',
                `We could not upload these files: ${failedList}.`,
                { list: failedList }
              )
            : getMessage(
                'admin.message.uploadFailedGeneric',
                'Something went wrong during upload. Please try again.'
              ),
          'admin-message--error'
        );
        return;
      }

      const hasSuccess = results.some((result) => result.status === 'fulfilled');
      if (hasSuccess) {
        setUploadMessage(
          getMessage('admin.message.uploadSuccess', 'All set! Your media is now in the gallery.'),
          'admin-message--success'
        );
        clearSelectedFiles();
        uploadProgressBar.style.width = '0%';
        uploadProgressBar.textContent = '0%';
      } else {
        setUploadMessage(
          getMessage('admin.message.noUploads', 'No files were uploaded.'),
          'admin-message--error'
        );
      }
    })
    .catch((error) => {
      console.error('Upload failed:', error);
      uploadButton.disabled = false;
      setUploadMessage(
        getMessage('admin.message.uploadFailedGeneric', 'Something went wrong during upload. Please try again.'),
        'admin-message--error'
      );
    });
});
