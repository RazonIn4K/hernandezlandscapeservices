import { expect, test } from './fixtures';

for (const [route, quotePrefix] of [['/lawn-care/', '/?service=lawn-care#quote'], ['/es/lawn-care/', '/es/?service=lawn-care#quote']] as const) {
  test(`${route} presents services and a request before seasonal guidance`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const content = page.locator('.service-content');
    const groups = content.locator(':scope > .grid');
    const quote = content.locator(':scope > .service-cta');
    const season = content.locator(':scope > .when-card');
    await expect(groups.locator('ul > li')).toHaveCount(8);
    await expect(groups.locator(':scope > .bg-green-50')).toHaveCount(2);
    const order = await content.evaluate((el) => {
      const children = Array.from(el.children);
      return ['.grid', '.service-cta', '.when-card'].map((selector) => children.findIndex((child) => child.matches(selector)));
    });
    expect(order[0]).toBeGreaterThan(-1);
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
    const request = quote.locator('a[href*="service=lawn-care"]');
    const url = new URL((await request.getAttribute('href'))!, page.url());
    expect(`${url.pathname}${url.search}${url.hash}`).toBe(quotePrefix);
    await request.click();
    await expect(page.locator('#contactService')).toHaveValue('lawn-care');
    await expect(season).toHaveCount(0); // Navigation reached the homepage.
  });
}
