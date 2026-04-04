import { expect, test } from './fixtures';

const responsiveViewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

const getCardHeightSpread = async (page, selector: string) => {
  const heights = await page.$$eval(selector, (elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height))
  );

  if (!heights.length) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(...heights) - Math.min(...heights);
};

test.describe('Static Gallery Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('/');
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
    // Test main navigation links
    const navLinks = [
      '#services',
      '#gallery', 
      '#pricing',
      '#testimonials',
      '#service-area',
      '#quote'
    ];
    
    for (const link of navLinks) {
      await page.click(`a[href="${link}"]`);
      await expect(page.locator(link)).toBeInViewport();
    }
  });

  test('pricing section displays correctly', async ({ page }) => {
    await page.goto('/#pricing');

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
    await page.goto('/#quote');
    
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

  test('mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
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

      await page.goto('/');
      await page.waitForSelector('#gallery .grid.md\\:grid-cols-3 > div');

      const homeOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(homeOverflow, `Home overflow at ${viewport.name}`).toBeLessThanOrEqual(1);

      const homeSpread = await getCardHeightSpread(page, '#gallery .grid.md\\:grid-cols-3 > div');
      expect(homeSpread, `Home card height spread at ${viewport.name}`).toBeLessThanOrEqual(1);

      await page.goto('/gallery.html');
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
    // Check language toggle buttons exist
    const enButton = page.locator('[data-lang-switch="en"]').first();
    const esButton = page.locator('[data-lang-switch="es"]').first();
    
    await expect(enButton).toBeVisible();
    await expect(esButton).toBeVisible();
    
    // Test switching to Spanish
    await esButton.click();
    await expect(esButton).toHaveAttribute('aria-pressed', 'true');
    
    // Test switching back to English
    await enButton.click();
    await expect(enButton).toHaveAttribute('aria-pressed', 'true');
  });
});
