(function() {
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

    // Static image list - these are the actual photos in hernandez_images/
    const staticImages = [
      {
        src: 'hernandez_images/web_Wideshot_Bestlandscape_Person.jpeg',
        alt: 'Professional landscaping work by Hernandez Landscape & Tree Service',
        caption: 'Transform your outdoor space with expert landscaping design and installation'
      },
      {
        src: 'hernandez_images/web_Wideshot_Bestlandscape.jpg',
        alt: 'Beautiful landscape design and installation',
        caption: 'Complete landscape renovation with premium materials and craftsmanship'
      },
      {
        src: 'hernandez_images/web_Wideshot_Bestlandscape2.jpeg',
        alt: 'Professional landscape maintenance',
        caption: 'Regular maintenance keeps your property looking its best year-round'
      },
      {
        src: 'hernandez_images/web_Before1.jpeg',
        alt: 'Before landscape renovation',
        caption: 'Before: See the potential for transformation'
      },
      {
        src: 'hernandez_images/web_After1.jpeg',
        alt: 'After landscape renovation',
        caption: 'After: Beautiful, functional outdoor space completed'
      },
      {
        src: 'hernandez_images/web_IMG_9256.jpeg',
        alt: 'Professional tree trimming service',
        caption: 'Expert tree care and maintenance for healthy, beautiful trees'
      },
      {
        src: 'hernandez_images/web_IMG_9259.jpeg',
        alt: 'Tree removal and cleanup',
        caption: 'Safe and efficient tree removal with thorough cleanup'
      },
      {
        src: 'hernandez_images/web_Logo.jpg',
        alt: 'Hernandez Landscape & Tree Service Logo',
        caption: 'Professional landscaping and tree services in DeKalb County'
      }
    ];

    const placeholder = document.createElement('p');
    placeholder.className = 'text-gray-500 text-center col-span-full';
    placeholder.textContent = getText('gallery.placeholder', 'Loading gallery...');

    galleryContainer.appendChild(placeholder);

    function createImageCard(image, index) {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
      
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt;
      img.className = 'w-full h-64 object-cover';
      img.loading = index < 6 ? 'eager' : 'lazy';
      
      const caption = document.createElement('div');
      caption.className = 'p-4';
      caption.innerHTML = `
        <p class="text-sm text-gray-700">${image.caption}</p>
      `;
      
      card.appendChild(img);
      card.appendChild(caption);
      
      return card;
    }

    function renderGallery() {
      galleryContainer.innerHTML = '';
      
      if (staticImages.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-500 text-center col-span-full';
        emptyMessage.textContent = getText('gallery.placeholder', 'Your new photos will appear here after you add them to the hernandez_images folder.');
        galleryContainer.appendChild(emptyMessage);
        return;
      }

      staticImages.forEach((image, index) => {
        const card = createImageCard(image, index);
        galleryContainer.appendChild(card);
      });
    }

    function renderLatestCarousel() {
      if (!latestTrack || !latestCarousel || !latestEmpty) {
        return;
      }

      const latestItems = staticImages.slice(0, 6);
      latestTrack.innerHTML = '';

      if (!latestItems.length) {
        latestEmpty.style.display = 'block';
        latestCarousel.style.display = 'none';
        return;
      }

      latestEmpty.style.display = 'none';
      latestCarousel.style.display = 'block';

      latestItems.forEach((image) => {
        const slide = document.createElement('div');
        slide.className = 'flex-shrink-0 w-64 h-48 bg-gray-200 rounded-lg overflow-hidden';
        
        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt;
        img.className = 'w-full h-full object-cover';
        
        slide.appendChild(img);
        latestTrack.appendChild(slide);
      });
    }

    // Initialize gallery
    renderGallery();
    renderLatestCarousel();

    // Make functions globally available for manual updates
    window.staticGallery = {
      refresh: renderGallery,
      refreshCarousel: renderLatestCarousel,
      images: staticImages
    };
  });
})();
