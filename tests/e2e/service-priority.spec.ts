import { expect, test } from './fixtures';

for (const [route, service, destination] of [
  ['/tree-removal/', 'tree-service', '/'],
  ['/es/tree-removal/', 'tree-service', '/es/'],
  ['/landscaping-design/', 'landscaping', '/'],
  ['/es/landscaping-design/', 'landscaping', '/es/'],
] as const) {
  test(`${route} presents service details and contact before seasonal guidance`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const content = page.locator('.service-content');
    const groups = content.locator(':scope > .grid');
    const cta = content.locator(':scope > .service-cta');
    const order = await content.evaluate((element) => {
      const children = Array.from(element.children);
      return ['.grid', '.service-cta', '.when-card'].map(selector => children.findIndex(child => child.matches(selector)));
    });
    expect(order[0]).toBeGreaterThan(-1);
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
    await expect(groups.locator(':scope > .bg-green-50')).toHaveCount(2);
    const request = cta.locator(`a[href*="service=${service}"]`);
    const url = new URL((await request.getAttribute('href'))!, page.url());
    expect(`${url.pathname}${url.search}${url.hash}`).toBe(`${destination}?service=${service}#quote`);
    await request.click();
    await expect(page.locator('#contactService')).toHaveValue(service);
  });
}
