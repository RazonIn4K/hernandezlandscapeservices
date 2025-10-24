(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) {
      return;
    }

    const latestCarousel = document.getElementById('latest-uploads-carousel');
    const latestTrack = document.getElementById('latest-uploads-track');
    const latestEmpty = document.getElementById('latest-uploads-empty');

    const i18n = window.siteI18n || null;
    const getText = (key, fallback) => {
      if (i18n && typeof i18n.t === 'function') {
        const value = i18n.t(key);
        if (value) {
          return value;
        }
      }
      return fallback;
    };

    const placeholder = document.createElement('p');
    placeholder.className = 'text-gray-500 text-center col-span-full';

    const placeholderTexts = {
      loading: ['gallery.loading', 'Loading gallery...'],
      'no-config': ['gallery.error.configMissing', 'Missing assets/js/firebase-config.js. Add it to load photos.'],
      'no-firebase': ['gallery.error.firebase', 'Unable to load Firebase. Check your connection.'],
      'no-items': ['gallery.placeholder', 'Your new photos will appear here after you upload them.'],
      error: ['gallery.error.generic', 'We could not load the gallery right now. Please try again later.']
    };

    let placeholderState = 'loading';
    function refreshPlaceholder() {
      if (placeholderState === 'hidden') {
        return;
      }
      const [key, fallback] = placeholderTexts[placeholderState] || placeholderTexts.loading;
      placeholder.textContent = getText(key, fallback);
    }

    refreshPlaceholder();
    galleryContainer.appendChild(placeholder);

    const PAGE_SIZE = 24;
    const LATEST_UPLOAD_LIMIT = 12;

    const latestEntries = new Map();
    const renderedEntries = new Set();

    const loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'col-span-full flex justify-center mt-8';
    const loadMoreButton = document.createElement('button');
    loadMoreButton.type = 'button';
    loadMoreButton.className = 'bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition';
    loadMoreWrapper.appendChild(loadMoreButton);

    let loadMoreState = 'idle';
    function refreshLoadMoreButton() {
      if (loadMoreState === 'loading') {
        loadMoreButton.textContent = getText('gallery.loadingButton', 'Loading...');
      } else {
        loadMoreButton.textContent = getText('gallery.loadMore', 'Load more items');
      }
    }
    refreshLoadMoreButton();

    loadMoreButton.addEventListener('click', () => {
      if (!isLoading && !reachedEnd) {
        fetchPage();
      }
    });

    const latestCarouselEntries = () => Array.from(latestEntries.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LATEST_UPLOAD_LIMIT);

    function renderLatestCarousel() {
      if (!latestTrack || !latestCarousel || !latestEmpty) {
        return;
      }

      const items = latestCarouselEntries();
      latestTrack.innerHTML = '';

      if (!items.length) {
        latestCarousel.classList.add('hidden');
        latestEmpty.classList.remove('hidden');
        return;
      }

      latestCarousel.classList.remove('hidden');
      latestEmpty.classList.add('hidden');

      items.forEach((entry) => {
        const slide = document.createElement('div');
        slide.className = 'snap-start shrink-0 w-64';

        const figure = document.createElement('figure');
        figure.className = 'relative h-48 rounded-lg overflow-hidden shadow-lg bg-gray-100';

        if (entry.mediaCategory === 'video') {
          if (entry.thumbnailURL) {
            const thumb = document.createElement('img');
            thumb.src = entry.thumbnailURL;
            thumb.alt = entry.title;
            thumb.loading = 'lazy';
            thumb.className = 'w-full h-full object-cover';
            figure.appendChild(thumb);
          } else {
            const video = document.createElement('video');
            video.src = entry.downloadURL;
            video.preload = 'metadata';
            video.controls = true;
            video.muted = true;
            video.className = 'w-full h-full object-cover';
            figure.appendChild(video);
          }

          const caption = document.createElement('figcaption');
          caption.className = 'absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs sm:text-sm px-3 py-2';
          caption.textContent = `${entry.title} · ${getText('gallery.latest.videoTag', 'Video')}`;
          figure.appendChild(caption);
        } else if (entry.mediaCategory === 'image') {
          const img = document.createElement('img');
          img.src = entry.thumbnailURL || entry.downloadURL;
          img.alt = entry.title;
          img.loading = 'lazy';
          img.className = 'w-full h-full object-cover';
          figure.appendChild(img);

          const caption = document.createElement('figcaption');
          caption.className = 'absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs sm:text-sm px-3 py-2';
          caption.textContent = entry.title;
          figure.appendChild(caption);
        } else {
          const card = document.createElement('a');
          card.href = entry.downloadURL;
          card.target = '_blank';
          card.className = 'w-full h-full flex flex-col items-center justify-center bg-gray-200 hover:bg-gray-300 transition';
          card.innerHTML = '<div class="text-3xl text-gray-500 mb-2">📎</div>' + `<div class="text-xs text-gray-600 text-center px-2">${entry.title}</div>`;
          figure.appendChild(card);
        }

        slide.appendChild(figure);
        latestTrack.appendChild(slide);
      });
    }

    function registerLatest(entry) {
      latestEntries.set(entry.id, entry);
      if (latestEntries.size > 60) {
        const sorted = Array.from(latestEntries.entries()).sort((a, b) => b[1].createdAt - a[1].createdAt).slice(0, 60);
        latestEntries.clear();
        sorted.forEach(([key, value]) => latestEntries.set(key, value));
      }
      renderLatestCarousel();
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

    function getFileTypeFromUrl(url) {
      const extension = url.split('.').pop().toLowerCase();
      if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
        return 'video';
      }
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        return 'image';
      }
      return 'other';
    }

    function deriveTitleFromName(name) {
      return name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Gallery item';
    }

    function extractTimestamp(name) {
      const match = name.match(/^(\d{13})-/);
      return match ? Number(match[1]) : 0;
    }

    function createMediaFigure(entry) {
      const figure = document.createElement('figure');
      figure.className = 'relative overflow-hidden rounded-lg shadow-lg bg-gray-100 group';
      figure.dataset.mediaCategory = entry.mediaCategory;

      if (entry.mediaCategory === 'video') {
        const video = document.createElement('video');
        video.src = entry.downloadURL;
        video.preload = 'metadata';
        video.controls = true;
        video.muted = true;
        video.className = 'w-full h-64 object-cover transition duration-300 ease-in-out transform group-hover:scale-105';
        if (entry.thumbnailURL) {
          video.setAttribute('poster', entry.thumbnailURL);
        }
        figure.appendChild(video);

        if (entry.title) {
          const caption = document.createElement('figcaption');
          caption.className = 'absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs sm:text-sm px-3 py-2';
          caption.textContent = `${entry.title} · ${getText('gallery.latest.videoTag', 'Video')}`;
          figure.appendChild(caption);
        }
      } else if (entry.mediaCategory === 'image') {
        const img = document.createElement('img');
        img.src = entry.thumbnailURL || entry.downloadURL;
        img.alt = entry.title;
        img.loading = 'lazy';
        img.className = 'w-full h-64 object-cover transition duration-300 ease-in-out transform group-hover:scale-105';
        figure.appendChild(img);

        if (entry.title) {
          const caption = document.createElement('figcaption');
          caption.className = 'absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs sm:text-sm px-3 py-2';
          caption.textContent = entry.title;
          figure.appendChild(caption);
        }
      } else {
        const link = document.createElement('a');
        link.href = entry.downloadURL;
        link.target = '_blank';
        link.className = 'w-full h-64 flex flex-col items-center justify-center bg-gray-200 hover:bg-gray-300 transition';
        link.innerHTML = '<div class="text-4xl text-gray-500 mb-2">📎</div>' + `<div class="text-sm text-gray-600 text-center px-2">${entry.title}</div>`;
        figure.appendChild(link);
      }

      return figure;
    }

    function renderEntries(entries) {
      if (!entries.length && !renderedEntries.size) {
        placeholderState = 'no-items';
        refreshPlaceholder();
        return;
      }

      if (galleryContainer.contains(placeholder)) {
        galleryContainer.removeChild(placeholder);
        placeholderState = 'hidden';
      }

      if (!galleryContainer.contains(loadMoreWrapper)) {
        galleryContainer.appendChild(loadMoreWrapper);
      }

      entries.forEach((entry) => {
        if (!entry || renderedEntries.has(entry.id)) {
          return;
        }

        const figure = createMediaFigure(entry);
        galleryContainer.insertBefore(figure, loadMoreWrapper);
        renderedEntries.add(entry.id);
        registerLatest(entry);
      });
    }

    function updateLoadMoreVisibility() {
      if (reachedEnd) {
        if (galleryContainer.contains(loadMoreWrapper)) {
          galleryContainer.removeChild(loadMoreWrapper);
        }
      } else if (!galleryContainer.contains(loadMoreWrapper) && renderedEntries.size) {
        galleryContainer.appendChild(loadMoreWrapper);
      }
      refreshLoadMoreButton();
    }

    function docToEntry(doc) {
      const data = doc.data();
      if (!data || !data.downloadURL) {
        return null;
      }
      if (data.published === false) {
        return null;
      }
      const createdAt = data.createdAt && typeof data.createdAt.toMillis === 'function'
        ? data.createdAt.toMillis()
        : Date.now();
      const mediaCategory = data.mediaCategory || mediaCategoryFromType(data.contentType || '');
      return {
        id: doc.id,
        downloadURL: data.downloadURL,
        thumbnailURL: data.thumbnailURL || null,
        title: (data.title || '').trim() || deriveTitleFromName(data.originalFileName || doc.id),
        description: (data.description || '').trim(),
        mediaCategory,
        contentType: data.contentType || null,
        createdAt,
      };
    }

    function storageItemToEntry(itemRef) {
      return itemRef.getDownloadURL().then((url) => {
        const mediaCategory = getFileTypeFromUrl(url);
        return {
          id: itemRef.fullPath,
          downloadURL: url,
          thumbnailURL: mediaCategory === 'image' ? url : null,
          title: deriveTitleFromName(itemRef.name),
          description: '',
          mediaCategory,
          contentType: null,
          createdAt: extractTimestamp(itemRef.name) || Date.now(),
        };
      });
    }

    if (typeof window.firebaseConfig === 'undefined') {
      placeholderState = 'no-config';
      refreshPlaceholder();
      return;
    }

    if (typeof firebase === 'undefined') {
      placeholderState = 'no-firebase';
      refreshPlaceholder();
      return;
    }

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig);

    let firestore = null;
    let galleryCollection = null;
    let useFirestore = false;

    try {
      firestore = firebase.firestore(app);
      galleryCollection = firestore.collection('media');
      useFirestore = true;
    } catch (error) {
      console.warn('Firestore unavailable, using Storage fallback.', error);
    }

    const storage = firebase.storage(app);
    const storageRefs = [
      storage.ref('media'),
      storage.ref('gallery-media'),
      storage.ref('gallery-images'),
    ];
    let storageRefIndex = 0;
    let storageRef = storageRefs[storageRefIndex];

    let isLoading = false;
    let nextPageToken = null;
    let lastDoc = null;
    let reachedEnd = false;

    function handleError(error) {
      console.error('Gallery load error:', error);
      if (!galleryContainer.contains(placeholder)) {
        galleryContainer.insertBefore(placeholder, galleryContainer.firstChild);
      }
      placeholderState = 'error';
      refreshPlaceholder();
    }

    function fetchPage() {
      if (isLoading || reachedEnd) {
        return;
      }
      isLoading = true;
      loadMoreState = 'loading';
      refreshLoadMoreButton();

      if (useFirestore && galleryCollection) {
        let query = galleryCollection
          .where('published', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(PAGE_SIZE);
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        query.get()
          .then((snapshot) => {
            const docs = snapshot.docs || [];
            const entries = docs
              .map(docToEntry)
              .filter(Boolean);

            if (docs.length) {
              lastDoc = docs[docs.length - 1];
            }

            if (docs.length < PAGE_SIZE) {
              reachedEnd = true;
            }

            renderEntries(entries);
            updateLoadMoreVisibility();
          })
          .catch((error) => {
            handleError(error);
          })
          .finally(() => {
            isLoading = false;
            loadMoreState = 'idle';
            refreshLoadMoreButton();
          });
      } else {
        let switchStorageRef = false;
        storageRef.list({ maxResults: PAGE_SIZE, pageToken: nextPageToken })
          .then((listResult) => {
            nextPageToken = listResult.nextPageToken || null;
            const items = listResult.items.slice().reverse();
            return Promise.all(items.map(storageItemToEntry));
          })
          .then((entries) => {
            if (!entries.length && !nextPageToken && storageRefIndex + 1 < storageRefs.length) {
              switchStorageRef = true;
              return;
            }
            if (!nextPageToken) {
              reachedEnd = true;
            }
            renderEntries(entries);
            updateLoadMoreVisibility();
          })
          .catch((error) => {
            handleError(error);
          })
          .finally(() => {
            isLoading = false;
            loadMoreState = 'idle';
            refreshLoadMoreButton();
            if (switchStorageRef) {
              storageRefIndex += 1;
              storageRef = storageRefs[storageRefIndex];
              nextPageToken = null;
              reachedEnd = false;
              fetchPage();
            }
          });
      }
    }

    fetchPage();

    if (i18n && typeof i18n.onChange === 'function') {
      i18n.onChange(() => {
        refreshPlaceholder();
        refreshLoadMoreButton();
        renderLatestCarousel();
      });
    }
  });
})();
