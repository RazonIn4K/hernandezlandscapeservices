(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const latestCarousel = document.getElementById('latest-uploads-carousel');
    const latestTrack = document.getElementById('latest-uploads-track');
    const latestEmpty = document.getElementById('latest-uploads-empty');

    if (!galleryContainer && !latestCarousel) {
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

    // Static image list generated from media/gallery.json by scripts/update-media.mjs
    // (npm run media:update). Do not edit between the markers.
    const staticImages = [
      // GALLERY-DATA:GENERATED:START
      {
        src: 'hernandez_images/facebook-2026-fire-pit-lawn-finish.jpg',
        alt: 'Finished lawn and fire pit area completed by Hernandez Landscape in DeKalb',
        caption: 'Finished lawn and fire pit area with clean edging and fresh turf'
      },
      {
        src: 'hernandez_images/facebook-2026-side-yard-lawn-finish.jpg',
        alt: 'Fresh green side yard lawn after Hernandez Landscape service',
        caption: 'Fresh side yard lawn finish after cleanup and landscape work'
      },
      {
        src: 'hernandez_images/google-photos-2026-brush-pile-removal.webp',
        alt: 'Brush pile and tree debris staged after Hernandez Landscape cleanup',
        caption: 'Brush pile and tree debris staged for removal after yard cleanup'
      },
      {
        src: 'hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp',
        alt: 'Woodpile and overgrown yard area before Hernandez cleanup work',
        caption: 'Woodpile and overgrown yard area cleared during a cleanup project'
      },
      {
        src: 'hernandez_images/google-photos-2026-backyard-lawn-finish.webp',
        alt: 'Fresh backyard lawn finish after Hernandez Landscape service',
        caption: 'Fresh backyard lawn finish with clean mowing around trees and planting beds'
      },
      {
        src: 'hernandez_images/google-profile-2024-mulch-bed-edging.jpg',
        alt: 'Fresh red mulch bed with stone edging after Hernandez Landscape service',
        caption: 'Fresh mulch bed, stone edging, and planting cleanup around a DeKalb County home'
      },
      {
        src: 'hernandez_images/google-profile-2026-branded-truck-trailers.jpg',
        alt: 'Hernandez Landscape and Tree Service branded truck and trailers',
        caption: 'Branded Hernandez crew trucks and trailers ready for field work'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-canopy.jpg',
        alt: 'Tree service crew member working high in a tree canopy',
        caption: 'Tree climbing and canopy work for safe trimming and removal'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-removal-cut-logs.jpg',
        alt: 'Cut logs after tree removal cleanup',
        caption: 'Tree removal cleanup with cut logs handled on site'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-roofline.jpg',
        alt: 'Tree service crew working near a residential roofline',
        caption: 'Careful tree work around homes, roofs, and yard structures'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-full-tree.jpg',
        alt: 'Tree climber working in a tall residential tree',
        caption: 'Full-tree service work for mature residential trees'
      },
      {
        src: 'hernandez_images/google-profile-2026-completed-yard-equipment.jpg',
        alt: 'Completed yard work with Hernandez equipment on site',
        caption: 'Recent completed yard work with equipment still on site'
      },
      {
        src: 'hernandez_images/google-profile-2026-equipment-trailers.jpg',
        alt: 'Hernandez Landscape equipment trailers parked for service work',
        caption: 'Equipment trailers used for landscaping and tree service jobs'
      },
      {
        src: 'hernandez_images/web_IMG_3362_2.webp',
        alt: 'Freshly finished landscape bed and lawn edging',
        caption: 'Recent landscape refresh with clean borders and healthy planting beds'
      },
      {
        src: 'hernandez_images/web_IMG_3360_2.webp',
        alt: 'Fresh mulch installation framing a neat front yard',
        caption: 'Newly completed curb appeal upgrade with crisp mulch lines'
      },
      {
        src: 'hernandez_images/web_IMG_0434_poster.jpg',
        alt: 'Clean, modern outdoor patio and landscape',
        caption: 'Modern outdoor living space transformation'
      },
      {
        src: 'hernandez_images/web_IMG_1953.webp',
        alt: 'Professional tree trimming service',
        caption: 'Expert tree care and safety maintenance'
      },
      {
        src: 'hernandez_images/web_IMG_1464_poster.jpg',
        alt: 'Garden bed installation',
        caption: 'Custom garden bed design and installation'
      }
      // GALLERY-DATA:GENERATED:END
    ];

    // Intrinsic dimensions for the homepage's latest-upload cards. These files
    // are intentionally kept outside the generated block so media regeneration
    // does not discard the layout metadata.
    const imageDimensions = {
      'hernandez_images/facebook-2026-fire-pit-lawn-finish.jpg': { width: 900, height: 1200 },
      'hernandez_images/facebook-2026-side-yard-lawn-finish.jpg': { width: 900, height: 1200 },
      'hernandez_images/google-photos-2026-brush-pile-removal.webp': { width: 655, height: 873 },
      'hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp': { width: 1164, height: 873 },
      'hernandez_images/google-photos-2026-backyard-lawn-finish.webp': { width: 1164, height: 873 },
      'hernandez_images/google-profile-2024-mulch-bed-edging.jpg': { width: 901, height: 676 }
    };

    function applyImageMetadata(img, image) {
      const dimensions = imageDimensions[image.src];
      img.decoding = 'async';

      if (dimensions) {
        img.width = dimensions.width;
        img.height = dimensions.height;
      }
    }

    if (galleryContainer) {
      const placeholder = document.createElement('p');
      placeholder.className = 'text-gray-500 text-center col-span-full';
      placeholder.textContent = getText('gallery.placeholder', 'Loading gallery...');
      galleryContainer.appendChild(placeholder);
    }

    function createImageCard(image, index) {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
      
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt;
      img.className = 'w-full h-64 object-cover';
      img.loading = index < 6 ? 'eager' : 'lazy';
      applyImageMetadata(img, image);
      
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
      if (!galleryContainer) return;
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
        // Round 3: each upload joins the homepage work filmstrip as a captioned print.
        const slide = document.createElement('figure');
        slide.className = 'latest-upload-slide print';

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt;
        img.loading = 'lazy';
        img.fetchPriority = 'low';
        applyImageMetadata(img, image);

        slide.appendChild(img);
        const caption = captionFor(image.src);
        if (caption) slide.appendChild(caption);
        latestTrack.appendChild(slide);
      });
    }

    // Filmstrip captions reuse the gallery page's existing EN copy and ES keys.
    // Uploads without an entry simply show the photo.
    const CAPTIONS = {
      'hernandez_images/facebook-2026-fire-pit-lawn-finish.jpg': ['gallery.item.fire_pit', 'Finished Lawn & Fire Pit'],
      'hernandez_images/facebook-2026-side-yard-lawn-finish.jpg': ['gallery.card2.title', 'Fresh Lawn Finish', 'gallery.card2.subtitle', 'Cortland Area Home'],
      'hernandez_images/google-photos-2026-brush-pile-removal.webp': ['gallery.item.brush_removal', 'Brush Pile Removal'],
      'hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp': ['gallery.card3.title', 'Yard Cleanup', 'gallery.card3.subtitle', 'Northern Illinois Job Site'],
      'hernandez_images/google-photos-2026-backyard-lawn-finish.webp': ['gallery.item.backyard_finish', 'Backyard Lawn Finish'],
      'hernandez_images/google-profile-2024-mulch-bed-edging.jpg': ['gallery.item.mulch_edging', 'Mulch Bed & Edging']
    };
    const localized = (key, fallback) => {
      if (i18n && typeof i18n.getLanguage === 'function' && i18n.getLanguage() === 'es' && typeof i18n.t === 'function') {
        return i18n.t(key, 'es') || fallback;
      }
      return fallback;
    };
    function fillCaption(figcaption, entry) {
      figcaption.textContent = '';
      const title = document.createElement('span');
      title.textContent = localized(entry[0], entry[1]);
      figcaption.appendChild(title);
      if (entry[2]) {
        const sub = document.createElement('small');
        sub.textContent = localized(entry[2], entry[3]);
        figcaption.appendChild(sub);
      }
    }
    function captionFor(src) {
      const entry = CAPTIONS[src];
      if (!entry) return null;
      const figcaption = document.createElement('figcaption');
      figcaption.setAttribute('data-caption-src', src);
      fillCaption(figcaption, entry);
      return figcaption;
    }
    if (i18n && typeof i18n.onChange === 'function') {
      i18n.onChange(() => {
        if (!latestTrack) return;
        latestTrack.querySelectorAll('figcaption[data-caption-src]').forEach((figcaption) => {
          const entry = CAPTIONS[figcaption.getAttribute('data-caption-src')];
          if (entry) fillCaption(figcaption, entry);
        });
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
