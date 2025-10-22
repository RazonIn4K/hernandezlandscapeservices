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
      placeholder.textContent = 'Falta el archivo admin/firebase-config.js. Añádelo para cargar las fotos.';
      return;
    }

    if (typeof firebase === 'undefined') {
      placeholder.textContent = 'No se pudo cargar Firebase. Revisa tu conexión.';
      return;
    }

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig);
    const storage = firebase.storage(app);
    const storageRef = storage.ref('gallery-images');

    storageRef.listAll()
      .then((listResult) => {
        const items = listResult.items.slice().sort((a, b) => b.name.localeCompare(a.name));

        if (!items.length) {
          placeholder.textContent = 'Sube nuevas fotos desde el portal de administración para verlas aquí.';
          return;
        }

        galleryContainer.innerHTML = '';

        items.forEach((itemRef) => {
          itemRef.getDownloadURL()
            .then((url) => {
              const figure = document.createElement('figure');
              figure.className = 'relative overflow-hidden rounded-lg shadow-lg bg-gray-100';

              const img = document.createElement('img');
              img.src = url;
              img.loading = 'lazy';
              img.alt = 'Proyecto reciente de Hernandez Landscape & Tree Service';
              img.className = 'w-full h-64 object-cover transition duration-300 ease-in-out transform hover:scale-105';

              figure.appendChild(img);
              galleryContainer.appendChild(figure);
            })
            .catch((error) => {
              console.error('URL retrieval error:', error);
            });
        });
      })
      .catch((error) => {
        console.error('Gallery load error:', error);
        placeholder.textContent = 'No pudimos cargar las fotos ahora mismo. Intenta nuevamente.';
      });
  });
})();
