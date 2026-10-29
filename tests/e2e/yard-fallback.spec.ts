import { expect, test } from './fixtures';

test.describe('yard plan without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const [path, message] of [
    ['/', 'The yard plan needs JavaScript.'],
    ['/es/', 'El plano del jardín necesita JavaScript.'],
  ] as const) {
    test(`${path} directs visitors to the request instead of offering selections that cannot transfer`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.walk-yard-grid')).toBeHidden();
      await expect(page.locator('.yard-nojs')).toBeVisible();
      await expect(page.locator('.yard-nojs')).toContainText(message);
      await expect(page.locator('[data-i18n-key="yard.intro"]')).toBeHidden();
      const skip = page.locator('.yard-skip');
      await expect(skip).toBeVisible();
      await skip.click();
      await expect(page).toHaveURL(/#quoteFormCard$/);
      await expect(page.locator('#contactForm')).toBeVisible();
    });
  }
});
