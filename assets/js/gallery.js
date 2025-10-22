(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) {
      return;
    }

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
      error: ['gallery.error.generic', 'We could not load the photos right now. Please try again.']
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
    const storage = firebase.storage(app);
    const storageRef = storage.ref('gallery-images');
    const PAGE_SIZE = 24;
    let nextPageToken = null;
    let isLoading = false;

    const loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'col-span-full flex justify-center mt-8';

    const loadMoreButton = document.createElement('button');
    loadMoreButton.type = 'button';
    loadMoreButton.className = 'bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition';

    let loadMoreState = 'idle';
    function refreshLoadMoreButton() {
      if (loadMoreState === 'loading') {
        loadMoreButton.textContent = getText('gallery.loadingButton', 'Loading...');
      } else {
        loadMoreButton.textContent = getText('gallery.loadMore', 'Load more photos');
      }
    }

    refreshLoadMoreButton();
    loadMoreButton.addEventListener('click', () => {
      if (!isLoading) {
        fetchPage();
      }
    });
    loadMoreWrapper.appendChild(loadMoreButton);

    function renderItems(items) {
      if (!items.length) {
        if (galleryContainer.contains(placeholder)) {
          placeholderState = 'no-items';
          refreshPlaceholder();
        }
        return;
      }

      if (galleryContainer.contains(placeholder)) {
        galleryContainer.removeChild(placeholder);
        placeholderState = 'hidden';
      }

      if (!galleryContainer.contains(loadMoreWrapper)) {
        galleryContainer.appendChild(loadMoreWrapper);
      }

      items.forEach((itemRef) => {
        itemRef.getDownloadURL()
          .then((url) => {
            const figure = document.createElement('figure');
            figure.className = 'relative overflow-hidden rounded-lg shadow-lg bg-gray-100';

            const img = document.createElement('img');
            img.src = url;
            img.loading = 'lazy';
            img.alt = itemRef.name.replace(/_/g, ' ');
            img.className = 'w-full h-64 object-cover transition duration-300 ease-in-out transform hover:scale-105';

            figure.appendChild(img);
            galleryContainer.insertBefore(figure, loadMoreWrapper);
          })
          .catch((error) => {
            console.error('URL retrieval error:', error);
          });
      });
    }

    function updateLoadMoreVisibility() {
      if (nextPageToken) {
        if (!galleryContainer.contains(loadMoreWrapper)) {
          galleryContainer.appendChild(loadMoreWrapper);
        }
        loadMoreButton.disabled = false;
        loadMoreState = 'idle';
        refreshLoadMoreButton();
      } else if (galleryContainer.contains(loadMoreWrapper)) {
        galleryContainer.removeChild(loadMoreWrapper);
      }
    }

    function fetchPage() {
      isLoading = true;
      loadMoreButton.disabled = true;
      loadMoreState = 'loading';
      refreshLoadMoreButton();

      storageRef.list({ maxResults: PAGE_SIZE, pageToken: nextPageToken })
        .then((listResult) => {
          nextPageToken = listResult.nextPageToken || null;
          const items = listResult.items.slice().reverse();
          renderItems(items);
          updateLoadMoreVisibility();
        })
        .catch((error) => {
          console.error('Gallery load error:', error);
          if (!galleryContainer.contains(placeholder)) {
            galleryContainer.insertBefore(placeholder, galleryContainer.firstChild);
          }
          placeholderState = 'error';
          refreshPlaceholder();
          updateLoadMoreVisibility();
        })
        .finally(() => {
          isLoading = false;
          loadMoreButton.disabled = false;
          loadMoreState = 'idle';
          refreshLoadMoreButton();
        });
    }

    fetchPage();

    if (i18n && typeof i18n.onChange === 'function') {
      i18n.onChange(() => {
        refreshPlaceholder();
        refreshLoadMoreButton();
      });
    }
  });
})();
