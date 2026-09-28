import { expect, test } from './fixtures';

for (const route of ['/tree-removal/', '/es/tree-removal/']) {
  test(`the full service card becomes readable on a phone at ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'networkidle' });

    const card = page.locator('main .reveal').first();
    const heading = page.locator('main h1');
    const headingBounds = await heading.boundingBox();
    expect(headingBounds?.y).toBeLessThan(844);
    await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.99);
  });
}

test('below-fold home sections still wait until they approach the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  const card = page.locator('.service-card.reveal').first();
  expect(await card.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(844);
  expect(await card.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(0);

  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.99);
});
