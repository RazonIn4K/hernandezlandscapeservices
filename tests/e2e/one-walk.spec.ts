import { expect, test } from './fixtures';

// Round 3 · "One walk through the yard": one quote path on the homepage, with the
// lead contract (endpoint, field names, honeypots, dispatch) unchanged.

const fieldNames = (body: string | null) =>
  [...(body ?? '').matchAll(/name="([^"]+)"/g)].map((match) => match[1]);

test('homepage reads services, season, proof, then walk your yard straight into the request', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const order = await page.locator('main > *').evaluateAll((elements) => elements.map((el) => el.id || el.className));
  expect(order).toEqual(['home', 'services', 'year-in-the-yard', 'gallery', 'walk-your-yard', 'quote', 'testimonials', 'why-choose-us', 'area-faq']);
  // The full request form and the optional price check live in the same chapter.
  await expect(page.locator('#quote #contactForm')).toHaveCount(1);
  await expect(page.locator('#quote #instant-quote #quoteForm')).toHaveCount(1);
  await expect(page.locator('#quote #pricing h2')).toHaveText('Custom Landscaping Pricing');
  await expect(page.locator('#quote h2').first()).toHaveText('Tell us about it.');
  await expect(page.locator('#price-check-title')).toHaveText('Price check: see a starting range');
});

test('the full request keeps the round-1 Web3Forms field names', async ({ page }) => {
  let body: string | null = null;
  let url = '';
  await page.route('**/api.web3forms.com/**', async (route) => {
    body = route.request().postData();
    url = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/#quote', { waitUntil: 'domcontentloaded' });
  await page.locator('#contactName').fill('Contract Check');
  await page.locator('#contactPhone').fill('815-555-0100');
  await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
  await page.locator('#ownerVerify').check();
  await page.locator('#bestTime').selectOption('afternoon');
  await page.locator('#contactService').selectOption('lawn-care');
  await page.locator('#projectDetails').fill('Contract check only.');
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60000);
  });
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#modalMessage')).toContainText('Your estimate request was sent');
  expect(url).toBe('https://api.web3forms.com/submit');
  expect(fieldNames(body)).toEqual([
    'access_key', 'subject', 'from_name', 'form_loaded_at', 'name', 'phone', 'email', 'address',
    'owner_verified', 'best_time', 'service', 'message', 'website', 'response_instructions',
  ]);
  expect(body).toContain('Website Quote Form');
});

test('the price check quick send keeps its round-1 field names', async ({ page }) => {
  let body: string | null = null;
  await page.route('**/api.web3forms.com/**', async (route) => {
    body = route.request().postData();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/#instant-quote', { waitUntil: 'domcontentloaded' });
  await page.locator('#instantName').fill('Contract Check');
  await page.locator('#instantPhone').fill('815-555-0100');
  await page.locator('#propertyAddress').fill('123 Example Street, DeKalb');
  await page.locator('#isOwner').check();
  await page.locator('#serviceType').selectOption('tree-service');
  await page.locator('#zipCode').fill('60115');
  await page.locator('#sendInstantRequestBtn').click();
  await expect(page.locator('#modalMessage')).toContainText('estimate request was sent');
  expect(fieldNames(body)).toEqual([
    'access_key', 'subject', 'from_name', 'form_loaded_at', 'name', 'phone', 'email', 'address',
    'service', 'best_time', 'message', 'botcheck', 'response_instructions',
  ]);
  expect(body).toContain('Website Instant Quote');
});

test('walking the yard fills the request the visitor submits, right below', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('label[for="yard-lawn"]').click();
  await page.locator('label[for="yard-beds"]').click();
  await page.locator('[data-yard-cta]').click();
  // #51: the CTA lands on the form card and the areas ride in yard_areas, not the textarea.
  await expect(page.locator('#quoteFormCard')).toBeInViewport();
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The lawn, Garden beds');
  await expect(page.locator('#projectDetails')).toHaveValue('');
  await expect(page.locator('#contactForm #yardSelectionNotice')).toBeVisible();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('label[for="yard-tree"]').click();
  await page.locator('[data-yard-cta]').click();
  await expect(page.locator('#contactService')).toHaveValue('tree-service');
  await expect(page.locator('#quotePrefillNotice')).toBeVisible();
});

test('round-1 homepage anchors still resolve', async ({ page }) => {
  for (const id of ['quote', 'instant-quote', 'pricing', 'gallery', 'videos', 'services', 'why-choose-us', 'testimonials', 'service-area', 'faq', 'year-in-the-yard', 'walk-your-yard']) {
    await page.goto(`/#${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(`#${id}`), `#${id}`).toHaveCount(1);
    await expect(page.locator(`#${id}`), `#${id}`).toBeVisible();
  }
});

test('the work filmstrip is a labelled, keyboard-scrollable strip with working controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const strip = page.locator('#gallery .filmstrip');
  const track = strip.locator('[data-strip-track]');
  await expect(track).toHaveAttribute('role', 'region');
  await expect(track).toHaveAttribute('aria-label', 'Photos of our work');
  await expect(track).toHaveAttribute('tabindex', '0');
  await expect(strip.locator('.print')).toHaveCount(9);
  await track.scrollIntoViewIfNeeded();
  const prev = strip.getByRole('button', { name: 'Previous photos' });
  const next = strip.getByRole('button', { name: 'Next photos' });
  await expect(prev).toHaveAttribute('aria-disabled', 'true');
  await expect(strip.locator('[data-strip-count]')).toHaveText('1 / 9');
  await next.click();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  await expect(prev).toHaveAttribute('aria-disabled', 'false');
  await expect(strip.locator('[data-strip-count]')).toHaveText('2 / 9');
  const before = await track.evaluate((el) => el.scrollLeft);
  await track.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  const box = await next.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('on phones the price check folds until the visitor asks for it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const fold = page.locator('#instant-quote details.price-check-fold');
  await expect(fold).not.toHaveAttribute('open', '');
  await expect(page.locator('#instantName')).toBeHidden();
  // Round 4: the price check is a text link under the calls (the primary CTA asks for the quote).
  await page.locator('a.hero-price-link[href="#instant-quote"]').click();
  await expect(fold).toHaveAttribute('open', '');
  await expect(page.locator('#instantName')).toBeVisible();

  await page.goto('/#instant-quote', { waitUntil: 'domcontentloaded' });
  await expect(fold).toHaveAttribute('open', '');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(fold).toHaveAttribute('open', '');
});

test('homepage stays within the round-3 length budget at 390 and 1440', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium' && testInfo.project.name !== 'chrome-local', 'Font metrics differ per engine; the budget is measured in Chromium.');
  for (const [width, height, budget] of [[390, 844, 13000], [1440, 900, 9500]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(total, `home height at ${width}`).toBeLessThanOrEqual(budget);
  }
});
