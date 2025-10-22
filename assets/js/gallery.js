(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) {
      return;
    }

    const placeholder = document.createElement('p');
    placeholder.className = 'text-gray-500 text-center col-span-full';
    placeholder.textContent = 'Cargando galería...';
    galleryContainer.appendChild(placeholder);

    if (typeof window.firebaseConfig === 'undefined') {
      placeholder.textContent = 'Falta el archivo assets/js/firebase-config.js. Añádelo para cargar las fotos.';
      return;
    }

    if (typeof firebase === 'undefined') {
      placeholder.textContent = 'No se pudo cargar Firebase. Revisa tu conexión.';
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
    loadMoreButton.textContent = 'Cargar más fotos';
    loadMoreButton.className = 'bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition';
    loadMoreButton.addEventListener('click', () => {
      if (!isLoading) {
        fetchPage();
      }
    });
    loadMoreWrapper.appendChild(loadMoreButton);

    function renderItems(items) {
      if (!items.length && galleryContainer.contains(placeholder)) {
        placeholder.textContent = 'Sube nuevas fotos desde el portal de administración para verlas aquí.';
        return;
      }

      if (galleryContainer.contains(placeholder)) {
        galleryContainer.removeChild(placeholder);
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
        loadMoreButton.textContent = 'Cargar más fotos';
      } else if (galleryContainer.contains(loadMoreWrapper)) {
        galleryContainer.removeChild(loadMoreWrapper);
      }
    }

    function fetchPage() {
      isLoading = true;
      loadMoreButton.disabled = true;
      loadMoreButton.textContent = 'Cargando...';

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
          placeholder.textContent = 'No pudimos cargar las fotos ahora mismo. Intenta nuevamente.';
          updateLoadMoreVisibility();
        })
        .finally(() => {
          isLoading = false;
        });
    }

    // Kick off first page
    fetchPage();
  });
})();
