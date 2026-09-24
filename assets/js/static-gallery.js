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
        srcset: 'hernandez_images/w/facebook-2026-fire-pit-lawn-finish-480.webp 480w, hernandez_images/w/facebook-2026-fire-pit-lawn-finish-800.webp 800w, hernandez_images/facebook-2026-fire-pit-lawn-finish.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Finished lawn and fire pit area completed by Hernandez Landscape in DeKalb',
        caption: 'Finished lawn and fire pit area with clean edging and fresh turf'
      },
      {
        src: 'hernandez_images/facebook-2026-side-yard-lawn-finish.jpg',
        srcset: 'hernandez_images/w/facebook-2026-side-yard-lawn-finish-480.webp 480w, hernandez_images/w/facebook-2026-side-yard-lawn-finish-800.webp 800w, hernandez_images/facebook-2026-side-yard-lawn-finish.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Fresh green side yard lawn after Hernandez Landscape service',
        caption: 'Fresh side yard lawn finish after cleanup and landscape work'
      },
      {
        src: 'hernandez_images/google-photos-2026-brush-pile-removal.webp',
        srcset: 'hernandez_images/w/google-photos-2026-brush-pile-removal-480.webp 480w, hernandez_images/google-photos-2026-brush-pile-removal.webp 655w',
        width: 655,
        height: 873,
        alt: 'Brush pile and tree debris staged after Hernandez Landscape cleanup',
        caption: 'Brush pile and tree debris staged for removal after yard cleanup'
      },
      {
        src: 'hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp',
        srcset: 'hernandez_images/w/google-photos-2026-woodpile-yard-cleanup-480.webp 480w, hernandez_images/w/google-photos-2026-woodpile-yard-cleanup-800.webp 800w, hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp 1164w',
        width: 1164,
        height: 873,
        alt: 'Woodpile and overgrown yard area before Hernandez cleanup work',
        caption: 'Woodpile and overgrown yard area cleared during a cleanup project'
      },
      {
        src: 'hernandez_images/google-photos-2026-backyard-lawn-finish.webp',
        srcset: 'hernandez_images/w/google-photos-2026-backyard-lawn-finish-480.webp 480w, hernandez_images/w/google-photos-2026-backyard-lawn-finish-800.webp 800w, hernandez_images/google-photos-2026-backyard-lawn-finish.webp 1164w',
        width: 1164,
        height: 873,
        alt: 'Fresh backyard lawn finish after Hernandez Landscape service',
        caption: 'Fresh backyard lawn finish with clean mowing around trees and planting beds'
      },
      {
        src: 'hernandez_images/google-profile-2024-mulch-bed-edging.jpg',
        srcset: 'hernandez_images/w/google-profile-2024-mulch-bed-edging-480.webp 480w, hernandez_images/w/google-profile-2024-mulch-bed-edging-800.webp 800w, hernandez_images/google-profile-2024-mulch-bed-edging.jpg 901w',
        width: 901,
        height: 676,
        alt: 'Fresh red mulch bed with stone edging after Hernandez Landscape service',
        caption: 'Fresh mulch bed, stone edging, and planting cleanup around a DeKalb County home'
      },
      {
        src: 'hernandez_images/google-profile-2026-branded-truck-trailers.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-branded-truck-trailers-480.webp 480w, hernandez_images/w/google-profile-2026-branded-truck-trailers-800.webp 800w, hernandez_images/google-profile-2026-branded-truck-trailers.jpg 1200w',
        width: 1200,
        height: 900,
        alt: 'Hernandez Landscape and Tree Service branded truck and trailers',
        caption: 'Branded Hernandez crew trucks and trailers ready for field work'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-canopy.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-tree-climber-canopy-480.webp 480w, hernandez_images/w/google-profile-2026-tree-climber-canopy-800.webp 800w, hernandez_images/google-profile-2026-tree-climber-canopy.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Tree service crew member working high in a tree canopy',
        caption: 'Tree climbing and canopy work for safe trimming and removal'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-removal-cut-logs.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-tree-removal-cut-logs-480.webp 480w, hernandez_images/w/google-profile-2026-tree-removal-cut-logs-800.webp 800w, hernandez_images/google-profile-2026-tree-removal-cut-logs.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Cut logs after tree removal cleanup',
        caption: 'Tree removal cleanup with cut logs handled on site'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-roofline.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-tree-climber-roofline-480.webp 480w, hernandez_images/w/google-profile-2026-tree-climber-roofline-800.webp 800w, hernandez_images/google-profile-2026-tree-climber-roofline.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Tree service crew working near a residential roofline',
        caption: 'Careful tree work around homes, roofs, and yard structures'
      },
      {
        src: 'hernandez_images/google-profile-2026-tree-climber-full-tree.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-tree-climber-full-tree-480.webp 480w, hernandez_images/w/google-profile-2026-tree-climber-full-tree-800.webp 800w, hernandez_images/google-profile-2026-tree-climber-full-tree.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Tree climber working in a tall residential tree',
        caption: 'Full-tree service work for mature residential trees'
      },
      {
        src: 'hernandez_images/google-profile-2026-completed-yard-equipment.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-completed-yard-equipment-480.webp 480w, hernandez_images/w/google-profile-2026-completed-yard-equipment-800.webp 800w, hernandez_images/google-profile-2026-completed-yard-equipment.jpg 900w',
        width: 900,
        height: 1200,
        alt: 'Completed yard work with Hernandez equipment on site',
        caption: 'Recent completed yard work with equipment still on site'
      },
      {
        src: 'hernandez_images/google-profile-2026-equipment-trailers.jpg',
        srcset: 'hernandez_images/w/google-profile-2026-equipment-trailers-480.webp 480w, hernandez_images/w/google-profile-2026-equipment-trailers-800.webp 800w, hernandez_images/google-profile-2026-equipment-trailers.jpg 1200w',
        width: 1200,
        height: 900,
        alt: 'Hernandez Landscape equipment trailers parked for service work',
        caption: 'Equipment trailers used for landscaping and tree service jobs'
      },
      {
        src: 'hernandez_images/web_IMG_3362_2.webp',
        srcset: 'hernandez_images/w/web_IMG_3362_2-480.webp 480w, hernandez_images/w/web_IMG_3362_2-800.webp 800w, hernandez_images/web_IMG_3362_2.webp 900w',
        width: 900,
        height: 1200,
        alt: 'Freshly finished landscape bed and lawn edging',
        caption: 'Recent landscape refresh with clean borders and healthy planting beds'
      },
      {
        src: 'hernandez_images/web_IMG_3360_2.webp',
        srcset: 'hernandez_images/w/web_IMG_3360_2-480.webp 480w, hernandez_images/w/web_IMG_3360_2-800.webp 800w, hernandez_images/web_IMG_3360_2.webp 900w',
        width: 900,
        height: 1200,
        alt: 'Fresh mulch installation framing a neat front yard',
        caption: 'Newly completed curb appeal upgrade with crisp mulch lines'
      },
      {
        src: 'hernandez_images/web_IMG_0434_poster.jpg',
        srcset: 'hernandez_images/w/web_IMG_0434_poster-480.webp 480w, hernandez_images/web_IMG_0434_poster.jpg 720w',
        width: 720,
        height: 1280,
        alt: 'Clean, modern outdoor patio and landscape',
        caption: 'Modern outdoor living space transformation'
      },
      {
        src: 'hernandez_images/web_IMG_1953.webp',
        srcset: 'hernandez_images/w/web_IMG_1953-480.webp 480w, hernandez_images/web_IMG_1953.webp 640w',
        width: 640,
        height: 896,
        alt: 'Professional tree trimming service',
        caption: 'Expert tree care and safety maintenance'
      },
      {
        src: 'hernandez_images/web_IMG_1464_poster.jpg',
        srcset: 'hernandez_images/w/web_IMG_1464_poster-480.webp 480w, hernandez_images/web_IMG_1464_poster.jpg 540w',
        width: 540,
        height: 960,
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

    // Paths in the data are site-relative; root them so the Spanish home (/es/)
    // resolves the same files.
    const rooted = (path) => (/^(?:[a-z]+:|\/)/i.test(path) ? path : '/' + path);
    const rootSrcset = (srcset) => srcset.split(',').map((part) => rooted(part.trim())).join(', ');

    function applyImageMetadata(img, image, sizes) {
      const dimensions = imageDimensions[image.src] ||
        (image.width && image.height ? { width: image.width, height: image.height } : null);
      img.decoding = 'async';

      if (dimensions) {
        img.width = dimensions.width;
        img.height = dimensions.height;
      }
      // Round 4: right-sized WebP variants from media/gallery.json (build-time data).
      if (typeof image.srcset === 'string' && image.srcset) {
        img.sizes = sizes || '(min-width: 640px) 50vw, 92vw';
        img.srcset = rootSrcset(image.srcset);
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
      img.src = rooted(image.src);
      img.alt = image.alt;
      img.className = 'w-full h-64 object-cover';
      img.loading = index < 6 ? 'eager' : 'lazy';
      applyImageMetadata(img, image, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw');
      
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
        img.src = rooted(image.src);
        img.alt = ALT_KEYS[image.src] ? localized(ALT_KEYS[image.src], image.alt) : image.alt;
        img.loading = 'lazy';
        img.fetchPriority = 'low';
        // Prints are ~232px wide (clamp(216px, 64vw, 250px) minus the mount).
        applyImageMetadata(img, image, '232px');

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
    // Spanish alt text for the filmstrip prints (i18n.js alt.upload.*).
    const ALT_KEYS = {
      'hernandez_images/facebook-2026-fire-pit-lawn-finish.jpg': 'alt.upload.firePit',
      'hernandez_images/facebook-2026-side-yard-lawn-finish.jpg': 'alt.upload.sideYard',
      'hernandez_images/google-photos-2026-brush-pile-removal.webp': 'alt.upload.brushPile',
      'hernandez_images/google-photos-2026-woodpile-yard-cleanup.webp': 'alt.upload.woodpile',
      'hernandez_images/google-photos-2026-backyard-lawn-finish.webp': 'alt.upload.backyard',
      'hernandez_images/google-profile-2024-mulch-bed-edging.jpg': 'alt.upload.mulch'
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
