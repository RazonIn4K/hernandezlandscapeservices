import { expect, test } from './fixtures';

test.describe('Homepage starting range', () => {
  test('does not keep a $0-$0 placeholder in #priceRange', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#priceRange')).not.toHaveText(/^\s*\$0\s*[-\u2013\u2014]\s*\$0\s*$/);
    await expect(page.locator('#priceRange')).toContainText('(815) 501-1478');
  });
});
