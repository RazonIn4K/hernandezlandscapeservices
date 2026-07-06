import { expect, test } from './fixtures';

const responsiveViewports = [
  { name: 'narrow-mobile', width: 320, height: 740 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

const getCardHeightSpread = async (page: import('@playwright/test').Page, selector: string) => {
  const heights = await page.$$eval(selector, (elements: Element[]) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height))
  );

  if (!heights.length) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(...heights) - Math.min(...heights);
};

const parseJsonLd = async (page: import('@playwright/test').Page, url: string): Promise<Record<string, any>[]> => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const blocks = await page.$$eval(
    'script[type="application/ld+json"]',
    (els: Element[]) => els.map((el) => JSON.parse(el.textContent || '{}'))
  );
  return blocks as Record<string, any>[];
};

const flattenGraph = (blocks: Record<string, any>[]): Record<string, any>[] => {
  const nodes: Record<string, any>[] = [];
  for (const block of blocks) {
    if (block['@graph']) {
      nodes.push(...(block['@graph'] as Record<string, any>[]));
    } else {
      nodes.push(block);
    }
  }
  return nodes;
};

test.describe('Schema JSON-LD Validation', () => {
  const servicePages = [
    { url: '/tree-removal/', label: 'tree-removal', breadcrumb: 'Tree Removal' },
    { url: '/lawn-care/', label: 'lawn-care', breadcrumb: 'Lawn Care' },
    { url: '/snow-removal/', label: 'snow-removal', breadcrumb: 'Snow Removal' },
  ];

  const serviceAreaPages = [
    { url: '/service-areas/dekalb-il/', label: 'service-area-dekalb', breadcrumb: 'DeKalb, IL' },
    { url: '/service-areas/sycamore-il/', label: 'service-area-sycamore', breadcrumb: 'Sycamore, IL' },
    { url: '/service-areas/cortland-il/', label: 'service-area-cortland', breadcrumb: 'Cortland, IL' },
  ];

  for (const sp of servicePages) {
    test(`${sp.label}: JSON-LD parses without error`, async ({ page }) => {
      const blocks = await parseJsonLd(page, sp.url);
      expect(blocks.length).toBeGreaterThan(0);
    });

    test(`${sp.label}: has Service schema`, async ({ page }) => {
      const blocks = await parseJsonLd(page, sp.url);
      const nodes = flattenGraph(blocks);
      const service = nodes.find((n) => n['@type'] === 'Service');
      expect(service).toBeDefined();
      expect(service?.['provider']?.['@type']).toBe('HomeAndConstructionBusiness');
      const areas = Array.isArray(service?.['areaServed']) ? service?.['areaServed'] : [service?.['areaServed']];
      expect(areas.map((area) => area?.['name'])).toEqual(
        expect.arrayContaining(['DeKalb', 'Sycamore', 'Cortland', 'Malta', 'Genoa', 'Kingston'])
      );
    });

    test(`${sp.label}: links to priority service area pages`, async ({ page }) => {
      await page.goto(sp.url, { waitUntil: 'domcontentloaded' });

      for (const areaSlug of ['dekalb-il', 'sycamore-il', 'cortland-il']) {
        await expect(page.locator(`a[href="../service-areas/${areaSlug}/"]`)).toHaveCount(1);
      }
    });

    test(`${sp.label}: has BreadcrumbList with correct path`, async ({ page }) => {
      const blocks = await parseJsonLd(page, sp.url);
      const nodes = flattenGraph(blocks);
      const crumb = nodes.find((n) => n['@type'] === 'BreadcrumbList');
      expect(crumb).toBeDefined();
      const items = crumb?.['itemListElement'] ?? [];
      expect(items).toHaveLength(2);
      expect(items[0]['name']).toBe('Home');
      expect(items[1]['name']).toBe(sp.breadcrumb);
    });

    test(`${sp.label}: has FAQPage schema with 3 questions`, async ({ page }) => {
      const blocks = await parseJsonLd(page, sp.url);
      const nodes = flattenGraph(blocks);
      const faq = nodes.find((n) => n['@type'] === 'FAQPage');
      expect(faq).toBeDefined();
      const questions = faq?.['mainEntity'] ?? [];
      expect(questions.length).toBeGreaterThanOrEqual(3);
      for (const q of questions) {
        expect(q['@type']).toBe('Question');
        expect(q['name']).toBeTruthy();
        expect(q['acceptedAnswer']?.['text']).toBeTruthy();
      }
    });
  }

  test('homepage: JSON-LD has HomeAndConstructionBusiness and FAQPage, no single-item breadcrumb', async ({ page }) => {
    const blocks = await parseJsonLd(page, '/');
    const nodes = flattenGraph(blocks);
    expect(nodes.find((n) => n['@type'] === 'HomeAndConstructionBusiness')).toBeDefined();
    expect(nodes.find((n) => n['@type'] === 'FAQPage')).toBeDefined();
    // Removed on purpose (SEO_AUDIT_PLAN.md P2-1): a one-item breadcrumb adds no value.
    expect(nodes.find((n) => n['@type'] === 'BreadcrumbList')).toBeUndefined();
  });

  test('sitemap: includes video metadata for the videos page', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();

    expect(xml).toContain('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');
    expect(xml).toContain('<loc>https://hernandezlandscapeservices.com/videos.html</loc>');
    expect(xml).toContain('<loc>https://hernandezlandscapeservices.com/service-areas/</loc>');
    expect(xml).toContain('<loc>https://hernandezlandscapeservices.com/service-areas/dekalb-il/</loc>');
    expect(xml).toContain('<loc>https://hernandezlandscapeservices.com/service-areas/sycamore-il/</loc>');
    expect(xml).toContain('<loc>https://hernandezlandscapeservices.com/service-areas/cortland-il/</loc>');
    expect((xml.match(/<video:video>/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(xml).toContain('<video:thumbnail_loc>https://hernandezlandscapeservices.com/hernandez_images/web_IMG_0434_poster.jpg</video:thumbnail_loc>');
    expect(xml).toContain('<video:content_loc>https://hernandezlandscapeservices.com/hernandez_images/web_IMG_0434.mp4</video:content_loc>');
  });

  for (const sp of serviceAreaPages) {
    test(`${sp.label}: references org schema by @id, has FAQPage and breadcrumb`, async ({ page }) => {
      const blocks = await parseJsonLd(page, sp.url);
      const nodes = flattenGraph(blocks);
      // Per SEO_AUDIT_PLAN.md P0-2 the org node is fully defined only on the
      // homepage/schema.jsonld; subpages carry a bare @id reference.
      const orgRef = nodes.find((n) => n['@id'] === 'https://hernandezlandscapeservices.com/#organization');
      expect(orgRef).toBeDefined();
      expect(orgRef?.['@type']).toBeUndefined();
      expect(nodes.find((n) => n['@type'] === 'FAQPage')).toBeDefined();
      const crumb = nodes.find((n) => n['@type'] === 'BreadcrumbList');
      expect(crumb).toBeDefined();
      expect(crumb?.['itemListElement']?.at(-1)?.['name']).toBe(sp.breadcrumb);
    });
  }
});

test.describe('Static Gallery Functionality', () => {
  const testsWithCustomNavigation = new Set([
    'mobile responsiveness',
    'mobile call CTA is available across key public pages',
    'photo layouts remain aligned across breakpoints',
  ]);

  test.beforeEach(async ({ page }, testInfo) => {
    // Capture console logs for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    if (testsWithCustomNavigation.has(testInfo.title)) {
      return;
    }
    
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForSelector('body', { state: 'attached' });
  });

  test('loads homepage gallery and latest upload images', async ({ page }) => {
    await page.waitForSelector('#gallery .grid.md\\:grid-cols-3 img');
    await expect(page.locator('#gallery .grid.md\\:grid-cols-3 img')).toHaveCount(3);

    // Latest uploads are rendered dynamically by static-gallery.js
    await page.waitForSelector('#latest-uploads-track img');
    await expect(page.locator('#latest-uploads-track img')).toHaveCount(6);
  });

  test('displays latest uploads carousel', async ({ page }) => {
    // Wait for carousel to load
    await page.waitForSelector('#latest-uploads-carousel');
    
    const carousel = page.locator('#latest-uploads-carousel');
    await expect(carousel).toBeVisible();
    
    // Check carousel has images
    const carouselImages = carousel.locator('img');
    await expect(carouselImages.first()).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    const anchorLinks = ['#services', '#testimonials', '#quote'];

    for (const link of anchorLinks) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.click(`a[href="${link}"]`);
      await expect(page.locator(link)).toBeInViewport();
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const serviceAreaHubLink = page.locator('a[href="/service-areas/"]').filter({ hasText: /Service Area/i }).first();
    await expect(serviceAreaHubLink).toBeVisible();
    await serviceAreaHubLink.click();
    await expect(page).toHaveURL(/\/service-areas\/$/);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.click('a[href="gallery.html"]');
    await expect(page).toHaveURL(/\/gallery(?:\.html)?$/);
    await expect(page.locator('body')).toContainText(/Recent Projects|Project Video Tours|Gallery/i);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.click('a[href="videos.html"]');
    await expect(page).toHaveURL(/\/videos(?:\.html)?$/);
    await expect(page.locator('body')).toContainText(/Project Video Tours|Videos/i);
  });

  test('pricing section displays correctly', async ({ page }) => {
    await page.goto('/#pricing', { waitUntil: 'domcontentloaded' });

    const pricingSection = page.locator('section#pricing');
    await expect(pricingSection).toBeVisible();

    const heading = pricingSection.locator('h2');
    await expect(heading).toHaveText('Custom Landscaping Pricing');

    const ctaButton = pricingSection.locator('a[href="#quote"]');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveText(/Request a Personalized Quote/i);

    await expect(pricingSection).not.toContainText('Website Care Plans');
  });

  test('contact form is accessible', async ({ page }) => {
    await page.goto('/#quote', { waitUntil: 'domcontentloaded' });
    
    // Check form fields exist
    await expect(page.locator('#contactName')).toBeVisible();
    await expect(page.locator('#contactPhone')).toBeVisible();
    await expect(page.locator('#contactEmail')).toBeVisible();
    await expect(page.locator('#projectDetails')).toBeVisible();
    await expect(page.locator('#contactService')).toBeVisible();
    
    // Check submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText(/Send Quote Request/);
  });

  test('also available chips prefill the quote form', async ({ page }) => {
    await page.goto('/#services', { waitUntil: 'domcontentloaded' });

    const leafChip = page.locator('#services [data-prefill-service="leaf-removal"]');
    await leafChip.scrollIntoViewIfNeeded();
    await expect(leafChip).toBeVisible();
    await leafChip.click();

    await expect(page).toHaveURL(/service=leaf-removal/);
    await expect(page.locator('#quotePrefillNotice')).toBeVisible();
    await expect(page.locator('#contactService')).toHaveValue('leaf-removal');
    await expect(page.locator('#quotePrefillText')).toContainText('Leaf Removal');
  });

  test('service page CTAs prefill the quote form', async ({ page }) => {
    const services = [
      {
        path: '/tree-removal/',
        href: '../?service=tree-service#quote',
        value: 'tree-service',
        label: 'Tree Service',
      },
      {
        path: '/lawn-care/',
        href: '../?service=lawn-care#quote',
        value: 'lawn-care',
        label: 'Lawn Care',
      },
      {
        path: '/snow-removal/',
        href: '../?service=snow-removal#quote',
        value: 'snow-removal',
        label: 'Snow Removal',
      },
    ];

    for (const service of services) {
      await page.goto(service.path, { waitUntil: 'domcontentloaded' });
      await page.click(`a[href="${service.href}"]`);

      await expect(page.locator('#quote')).toBeInViewport();
      await expect(page.locator('#quotePrefillNotice')).toBeVisible();
      await expect(page.locator('#contactService')).toHaveValue(service.value);
      await expect(page.locator('#quotePrefillText')).toContainText(service.label);
      await page.waitForFunction(() => {
        const header = document.querySelector('#header');
        const quoteHeading = document.querySelector('#quote h2');
        const headerBottom = Math.round(header?.getBoundingClientRect().bottom ?? 0);
        const quoteHeadingTop = Math.round(quoteHeading?.getBoundingClientRect().top ?? 0);

        return quoteHeadingTop >= headerBottom && quoteHeadingTop <= window.innerHeight;
      });

      const positions = await page.evaluate(() => {
        const header = document.querySelector('#header');
        const quoteHeading = document.querySelector('#quote h2');

        return {
          headerBottom: Math.round(header?.getBoundingClientRect().bottom ?? 0),
          quoteHeadingTop: Math.round(quoteHeading?.getBoundingClientRect().top ?? 0),
          viewportHeight: window.innerHeight,
        };
      });

      expect(positions.quoteHeadingTop).toBeGreaterThanOrEqual(positions.headerBottom);
      expect(positions.quoteHeadingTop).toBeLessThanOrEqual(positions.viewportHeight);
    }
  });

  test('quote anchors land below the fixed header', async ({ page }) => {
    await page.goto('/?service=tree-service#quote', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#quotePrefillNotice:not(.hidden)');
    await page.waitForFunction(() => {
      const header = document.querySelector('#header');
      const quoteHeading = document.querySelector('#quote h2');
      const headerBottom = Math.round(header?.getBoundingClientRect().bottom ?? 0);
      const quoteHeadingTop = Math.round(quoteHeading?.getBoundingClientRect().top ?? 0);

      return quoteHeadingTop >= headerBottom && quoteHeadingTop <= window.innerHeight;
    });

    const positions = await page.evaluate(() => {
      const header = document.querySelector('#header');
      const quoteHeading = document.querySelector('#quote h2');

      return {
        headerBottom: Math.round(header?.getBoundingClientRect().bottom ?? 0),
        quoteHeadingTop: Math.round(quoteHeading?.getBoundingClientRect().top ?? 0),
        viewportHeight: window.innerHeight,
      };
    });

    expect(positions.quoteHeadingTop).toBeGreaterThanOrEqual(positions.headerBottom);
    expect(positions.quoteHeadingTop).toBeLessThanOrEqual(positions.viewportHeight);
  });

  test('testimonials section shows a sourced public review', async ({ page }) => {
    const testimonials = page.locator('#testimonials');

    await expect(testimonials).toContainText('Robert Tolito');
    await expect(testimonials.locator('a[href*="beautifullandscapes.net"]')).toHaveCount(1);
    await expect(testimonials.locator('a[href*="beautifullandscapes.net"]')).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  test('mobile call CTA is available across key public pages', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    for (const path of ['/', '/tree-removal/', '/service-areas/', '/pay/success.html']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const callCta = page.locator('[data-mobile-call-cta]');
      await expect(callCta).toBeVisible();
      await expect(callCta).toHaveAttribute('href', 'tel:18155011478');
      await expect(callCta).toContainText('Call Now');
    }
  });

  test('mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { state: 'attached' });

    const callCta = page.locator('[data-mobile-call-cta]');
    await expect(callCta).toBeVisible();
    await expect(callCta).toHaveAttribute('href', 'tel:18155011478');
    
    // Check mobile menu works
    const mobileMenuButton = page.locator('button[aria-label="Toggle mobile menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    await mobileMenuButton.click();
    await expect(page.locator('#mobileMenu')).toBeVisible();
    
    // Check navigation links in mobile menu
    const mobileNavLinks = page.locator('#mobileMenu a');
    await expect(mobileNavLinks).not.toHaveCount(0); // Any links rendered
  });

  test('photo layouts remain aligned across breakpoints', async ({ page }) => {
    for (const viewport of responsiveViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#gallery .grid.md\\:grid-cols-3 > div');

      const homeOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(homeOverflow, `Home overflow at ${viewport.name}`).toBeLessThanOrEqual(1);

      const homeSpread = await getCardHeightSpread(page, '#gallery .grid.md\\:grid-cols-3 > div');
      expect(homeSpread, `Home card height spread at ${viewport.name}`).toBeLessThanOrEqual(1);

      await page.goto('/gallery.html', { waitUntil: 'domcontentloaded' });
      const galleryCardCount = await page.locator('.gallery-item').count();

      // In SPA fallback environments, /gallery.html can resolve to the homepage.
      if (galleryCardCount > 0) {
        const galleryOverflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(galleryOverflow, `Gallery overflow at ${viewport.name}`).toBeLessThanOrEqual(1);

        const gallerySpread = await getCardHeightSpread(page, '.gallery-item');
        expect(gallerySpread, `Gallery card height spread at ${viewport.name}`).toBeLessThanOrEqual(1);
      } else {
        await page.waitForSelector('#gallery .grid.md\\:grid-cols-3 > div');
        const fallbackSpread = await getCardHeightSpread(page, '#gallery .grid.md\\:grid-cols-3 > div');
        expect(fallbackSpread, `Fallback gallery spread at ${viewport.name}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('language toggle functionality', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check language toggle buttons exist
    const enButton = page.getByRole('button', { name: 'EN' }).first();
    const esButton = page.getByRole('button', { name: 'ES' }).first();
    
    await expect(enButton).toBeVisible();
    await expect(esButton).toBeVisible();
    await expect(enButton).toHaveAttribute('aria-pressed', 'true');
    
    // Test switching to Spanish
    await esButton.click();
    await expect(esButton).toHaveAttribute('aria-pressed', 'true');
    
    // Test switching back to English
    await enButton.click();
    await expect(enButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('first visit defaults to English', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.setItem('siteLanguage', 'es');
      window.sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('body')).toHaveAttribute('data-language', 'en');
    await expect(page.getByRole('button', { name: 'EN' }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-i18n-key="hero.cta"]').first()).toContainText('Request Free Estimate');

    const storedLanguage = await page.evaluate(() => ({
      local: window.localStorage.getItem('siteLanguage'),
      session: window.sessionStorage.getItem('siteLanguage'),
    }));

    expect(storedLanguage).toEqual({
      local: null,
      session: 'en',
    });
  });

  test('language toggle translates quote prefill notice', async ({ page }) => {
    await page.goto('/?service=tree-service#quote', { waitUntil: 'commit' });
    await page.waitForSelector('#quotePrefillNotice:not(.hidden)');

    const esButton = page.locator('nav .hidden.lg\\:flex [data-lang-switch="es"]');
    await expect(esButton).toBeVisible();
    await esButton.click();

    await expect(page.locator('#quotePrefillText')).toContainText('Servicio seleccionado: Servicio de árboles');
    await page.waitForFunction(() => {
      const header = document.querySelector('#header');
      const quoteHeading = document.querySelector('#quote h2');
      const headerBottom = Math.round(header?.getBoundingClientRect().bottom ?? 0);
      const quoteHeadingTop = Math.round(quoteHeading?.getBoundingClientRect().top ?? 0);

      return quoteHeadingTop >= headerBottom && quoteHeadingTop <= window.innerHeight;
    });
  });
});
