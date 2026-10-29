import { expect, test } from './fixtures';

test.describe('mobile navigation without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const [route, menuLabel, services, quote] of [
    ['/', 'Menu', 'Services', '#quote'],
    ['/es/', 'Menú', 'Servicios', '#quote'],
    ['/lawn-care/', 'Menu', 'Services', '/#quote'],
    ['/gallery/', 'Menu', 'Services', '/#quote'],
    ['/es/gallery/', 'Menú', 'Servicios', '/es/#quote'],
    ['/es/lawn-care/', 'Menú', 'Servicios', '/es/?service=lawn-care#quote'],
    ['/es/service-areas/genoa-il/', 'Menú', 'Servicios', '/es/#quote'],
  ] as const) {
    test(`${route} exposes localized links through a native menu`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 600 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const menu = page.locator('.nojs-menu');
      const summary = menu.locator('summary');
      await expect(summary).toBeVisible();
      await expect(summary).toHaveText(menuLabel);
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(menu).toHaveAttribute('open', '');
      await expect(menu.getByRole('link', { name: services })).toBeVisible();
      await expect(menu.locator(`a[href="${quote}"]`)).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.keyboard.press('Enter');
      await expect(menu).not.toHaveAttribute('open', '');
    });
  }
});

test('enhanced mobile navigation is the only menu shown when JavaScript is enabled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/es/', '/lawn-care/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nojs-menu'), route).toBeHidden();
    const button = page.locator('#mobileMenuButton');
    await expect(button, route).toBeVisible();
    await button.click();
    await expect(page.locator('#mobileMenu'), route).toBeVisible();
  }
});

test.describe('in-page navigation without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const [route, fragment] of [['/', '#services'], ['/es/', '#services']] as const) {
    test(`${route} leaves the in-page destination visible when the menu stays open`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const menu = page.locator('.nojs-menu');
      await menu.locator('summary').click();
      await menu.locator(`a[href$="${fragment}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${fragment}$`));
      const heading = page.locator('#services h2').first();
      await expect(heading).toBeInViewport();
      const overlap = await heading.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return Boolean(top?.closest('.nojs-menu-panel'));
      });
      expect(overlap).toBe(false);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(menu).toHaveAttribute('open', '');
      await menu.locator(`a[href$="${fragment}"]`).click();
      await expect(heading).toBeInViewport();
    });
  }
});
