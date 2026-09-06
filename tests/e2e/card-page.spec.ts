import { expect, test } from './fixtures';

const googleMapsUrl =
  'https://www.google.com/maps/place/Hernandez+Landscape+%26+Tree+Service+LLC/@41.9353196,-88.7400065,17z/';
const facebookUrl =
  'https://www.facebook.com/people/Hernandez-Landscape-and-Tree-Services-LLC/61557568376084/';

test.describe('QR contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://**/*', (route) => route.abort());
  });

  test('uses verified contact and social destinations without runtime design dependencies', async ({
    page,
    request,
  }) => {
    const response = await request.get('/card.html');
    const html = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(html).not.toMatch(/YOUR_GOOGLE|cdn\.tailwindcss|font-awesome|cdnjs/);

    await page.goto('/card.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText('Tree Service, Lawn Care & Landscaping');
    await expect(page.locator('a[href="tel:18155011478"]').first()).toBeVisible();
    await expect(page.locator(`a[href="${googleMapsUrl}"]`)).toBeVisible();
    await expect(page.locator(`a[href="${facebookUrl}"]`)).toBeVisible();
    await expect(page.locator('a[href="/#quote"]').first()).toBeVisible();
  });

  test('keeps Spanish quote and service destinations through language changes', async ({ page }) => {
    await page.goto('/card.html', { waitUntil: 'domcontentloaded' });

    await page.locator('#languageToggle').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('#languageToggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('h1')).toHaveText('Árboles, Césped y Jardinería');
    await expect(page.getByText('Estimado gratis', { exact: true }).first()).toBeVisible();
    await expect(page.locator('a[href="/?lang=es#quote"]')).toHaveCount(3);
    expect(await page.locator('.service-list a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([
      '/es/tree-removal/',
      '/es/lawn-care/',
      '/es/landscaping-design/',
      '/?lang=es&service=leaf-removal#quote',
    ]);
    await expect(page.locator('.project-landscape')).toHaveAttribute('href', '/es/lawn-care/');
    await expect(page.locator('.project-tree')).toHaveAttribute('href', '/es/tree-removal/');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('.quick-action[href="/?lang=es#quote"]')).toBeVisible();
    await page.locator('#languageToggle').click();
    await expect(page.locator('a[href="/#quote"]')).toHaveCount(3);
    await expect(page.locator('.project-tree')).toHaveAttribute('href', '/tree-removal/');

    await page.locator('#languageToggle').click();
    await page.locator('.quick-action[href="/?lang=es#quote"]').click();
    await expect(page).toHaveURL(/\/\?lang=es#quote$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('[data-i18n-key="quote.formHeading"]')).toHaveText('Solicita una cotización gratis');
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('keeps project, service, review and final contact content opaque', async ({ page }) => {
      await page.goto('/card.html', { waitUntil: 'domcontentloaded' });
      const opacity = await page.locator('.reveal').evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).opacity),
      );
      expect(opacity.length).toBeGreaterThan(0);
      expect(opacity.every((value) => value === '1')).toBe(true);
      await expect(page.locator('.final-actions a[href="/#quote"]')).toBeVisible();
    });
  });

  test('keeps content opaque when the card script fails to load', async ({ page }) => {
    await page.route('**/assets/js/card.js*', (route) => route.abort());
    await page.goto('/card.html', { waitUntil: 'networkidle' });
    const hiddenContent = await page.locator('.reveal').evaluateAll((elements) =>
      elements.filter((element) => getComputedStyle(element).opacity !== '1').length,
    );
    expect(hiddenContent).toBe(0);
  });

  for (const legacyCopyFailure of ['false', 'throws']) {
    test(`offers manual copying when clipboard is denied and legacy copy ${legacyCopyFailure}`, async ({ page }) => {
      await page.addInitScript((failure) => {
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: async () => { throw new Error('Clipboard denied'); } },
          configurable: true,
        });
        Object.defineProperty(document, 'execCommand', {
          value: () => {
            if (failure === 'throws') throw new Error('Legacy copy unavailable');
            return false;
          },
          configurable: true,
        });
      }, legacyCopyFailure);
      await page.goto('/card.html', { waitUntil: 'domcontentloaded' });
      if (legacyCopyFailure === 'throws') await page.locator('#languageToggle').click();
      await page.locator('#shareButton').click();

      const manualInput = page.locator('#manualShareUrl');
      await expect(manualInput).toBeVisible();
      await expect(manualInput).toHaveValue(page.url());
      await expect(manualInput).toBeFocused();
      expect(await manualInput.evaluate((input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!)).toBe(page.url().length);
      await expect(page.locator('#toast')).not.toHaveText(/Page link copied\.|Enlace copiado\./);
      await expect(page.locator('#toast')).toContainText(legacyCopyFailure === 'throws' ? 'manualmente' : 'manually');

      await page.locator('#closeManualShare').click();
      await expect(page.locator('#manualShare')).toBeHidden();
      await expect(page.locator('#shareButton')).toBeFocused();
    });
  }

  test('downloads a complete contact card', async ({ page }) => {
    await page.goto('/card.html', { waitUntil: 'domcontentloaded' });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveContactButton').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Hernandez-Landscape.vcf');
    await expect(page.locator('#toast')).toContainText('Contact card downloaded.');
  });

  for (const viewport of [
    { name: 'small phone', width: 320, height: 740 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    test(`renders without overflow or broken images on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/card.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => ({
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
        overflow: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ) - window.innerWidth,
      }));

      expect(result.brokenImages).toEqual([]);
      expect(result.overflow).toBeLessThanOrEqual(1);
      if (viewport.width <= 600) {
        await expect(page.locator('.mobile-contact-bar')).toBeVisible();
      } else {
        await expect(page.locator('.mobile-contact-bar')).toBeHidden();
      }
    });
  }
});
