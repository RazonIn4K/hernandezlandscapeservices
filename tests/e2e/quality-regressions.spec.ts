import { expect, test } from './fixtures';

const serviceRoutes = [
  '/tree-removal/',
  '/lawn-care/',
  '/snow-removal/',
  '/landscaping-design/',
  '/leaf-removal/',
  '/gutter-cleaning/',
  '/pressure-washing/',
  '/service-areas/',
  '/service-areas/dekalb-il/',
  '/service-areas/sycamore-il/',
  '/service-areas/cortland-il/',
  '/service-areas/malta-il/',
  '/service-areas/genoa-il/',
  '/service-areas/kingston-il/',
  '/es/service-areas/sycamore-il/',
  '/es/service-areas/cortland-il/',
  '/es/service-areas/malta-il/',
  '/es/service-areas/genoa-il/',
  '/es/service-areas/kingston-il/',
];

test.describe('Route-level quality regressions', () => {
  test('all service routes expose a keyboard-operable mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });

    for (const route of serviceRoutes) {
      await page.goto(route, { waitUntil: 'load' });

      const button = page.locator('#mobileMenuButton');
      await expect(button, `${route}: menu button`).toBeVisible();
      const size = await button.boundingBox();
      expect(size?.width, `${route}: target width`).toBeGreaterThanOrEqual(44);
      expect(size?.height, `${route}: target height`).toBeGreaterThanOrEqual(44);

      await button.click();
      await expect(page.locator('#mobileMenu'), `${route}: menu opens`).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#mobileMenu a').first()).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(page.locator('#mobileMenu'), `${route}: Escape closes`).not.toBeVisible();
      await expect(button).toBeFocused();

      await expect(page.locator('a.skip-link[href="#main-content"]')).toHaveCount(1);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      const overflow = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      );
      expect(overflow, `${route}: horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });

  test('gallery and video mobile menus use the shared accessible behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const route of ['/gallery/', '/videos/']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const button = page.locator('#mobileMenuButton');
      await button.click();
      await expect(page.locator('#mobileMenu')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#mobileMenu')).not.toBeVisible();
      await expect(button).toBeFocused();
    }
  });

  test('video page defers below-fold posters and labels every control', async ({ request }) => {
    const response = await request.get('/videos/');
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    const videoTags = html.match(/<video\b[^>]*>/g) ?? [];

    expect(videoTags).toHaveLength(36);
    expect(videoTags.filter((tag) => /\sposter=/.test(tag))).toHaveLength(3);
    expect(videoTags.filter((tag) => /\sdata-poster=/.test(tag))).toHaveLength(33);
    expect(videoTags.every((tag) => /\saria-label="[^"]+"/.test(tag))).toBeTruthy();
    expect(videoTags.every((tag) => /\spreload="none"/.test(tag))).toBeTruthy();
  });

  test('video poster loader hydrates media only as it approaches the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/videos/', { waitUntil: 'domcontentloaded' });

    const deferredBeforeScroll = await page.locator('video[data-poster]').count();
    expect(deferredBeforeScroll).toBeGreaterThan(20);

    const lastVideo = page.locator('.video-grid video').last();
    await lastVideo.scrollIntoViewIfNeeded();
    await expect(lastVideo).toHaveAttribute('poster', /web_IMG_3611_poster\.jpg$/);
    await expect(lastVideo).not.toHaveAttribute('data-poster', /.+/);
  });

  test('Spanish mode localizes menu, slider, and video accessible names', async ({ page }) => {
    await page.goto('/videos/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-lang-switch="es"]:visible').click();
    await expect(page.locator('#mobileMenuButton')).toHaveAttribute(
      'aria-label',
      'Abrir o cerrar el menú móvil',
    );
    await expect(page.locator('.video-grid video').first()).toHaveAttribute(
      'aria-label',
      'Video del proyecto de Hernandez Landscape 1',
    );
    await expect(page.locator('.video-grid video').last()).toHaveAttribute(
      'aria-label',
      'Video del proyecto de Hernandez Landscape 36',
    );

    await page.goto('/gallery/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-lang-switch="es"]:visible').click();
    await expect(page.locator('#sliderHandle')).toHaveAttribute(
      'aria-label',
      'Mostrar la foto del después',
    );
  });

  test('public client bundle contains no direct owner-alert webhook', async ({ request }) => {
    const response = await request.get('/assets/js/main.js');
    const source = await response.text();
    expect(source).not.toMatch(/https:\/\/[^"']+\/webhook\//);
    expect(source).not.toMatch(/token\s*:\s*["'][A-Za-z0-9_-]{20,}["']/);
  });

  test('emergency form bounds input and recovers from a provider error', async ({ page }) => {
    await page.route('**/api.web3forms.com/**', async (route) => {
      await route.fulfill({ status: 502, contentType: 'text/plain', body: 'upstream unavailable' });
    });
    await page.goto('/tree-removal/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#emergencyName')).toHaveAttribute('maxlength', '100');
    await expect(page.locator('#emergencyPhone')).toHaveAttribute('autocomplete', 'tel');
    await expect(page.locator('#emergencyLocation')).toHaveAttribute('maxlength', '200');
    await expect(page.locator('#emergencyDetails')).toHaveAttribute('maxlength', '1000');

    await page.locator('#emergencyName').fill('Emergency Test');
    await page.locator('#emergencyPhone').fill('815 555 0100');
    await page.locator('#emergencyLocation').fill('60115');
    await page.locator('#emergencyType').selectOption('fallen-tree');
    await page.locator('#emergencyDispatchForm button[type="submit"]').click();

    const status = page.locator('[data-dispatch-status]');
    await expect(status).toHaveAttribute('role', 'alert');
    await expect(status.locator('a[href="tel:18155011478"]')).toBeVisible();
    await expect(page.locator('#emergencyName')).toHaveValue('Emergency Test');
    await expect(page.locator('#emergencyDispatchForm')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('emergency form accepts a mocked Web3Forms success', async ({ page }) => {
    await page.route('**/api.web3forms.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    await page.goto('/tree-removal/', { waitUntil: 'domcontentloaded' });
    await page.locator('#emergencyName').fill('Emergency Test');
    await page.locator('#emergencyPhone').fill('815 555 0100');
    await page.locator('#emergencyLocation').fill('60115');
    await page.locator('#emergencyType').selectOption('storm-damage');
    await page.locator('#emergencyDispatchForm button[type="submit"]').click();

    await expect(page.getByText('Emergency request sent.')).toBeVisible();
    await expect(page.locator('#emergencyDispatchForm')).toHaveCount(0);
  });

  test('homepage comparison slider supports the full keyboard range', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const slider = page.locator('#sliderHandle');
    await slider.focus();
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('PageUp');
    await expect(slider).toHaveAttribute('aria-valuenow', '10');
    await page.keyboard.press('ArrowDown');
    await expect(slider).toHaveAttribute('aria-valuenow', '5');
    await expect(slider).toHaveAttribute('aria-valuetext', /5%/);
  });
});
