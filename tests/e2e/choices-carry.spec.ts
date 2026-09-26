import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

// Round 5 · J2: the visitor's choices reach the request itself (LUXE-CRAFT-BAR J2).
// Each test reads the intercepted multipart body; nothing is sent to Web3Forms.

// The request form's payload, as sent today (unchanged by round 5; no new names).
const FIELDS = ['access_key', 'subject', 'from_name', 'form_loaded_at', 'name', 'phone', 'email', 'address', 'owner_verified', 'best_time', 'service', 'message', 'website', 'response_instructions'];

function parse(body: string) {
  const fields: Array<[string, string]> = [];
  // multipart bodies carry line breaks as CRLF
  for (const m of body.matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)) fields.push([m[1], m[2].replace(/\r\n/g, '\n')]);
  return { names: fields.map(([n]) => n), get: (n: string) => fields.find(([k]) => k === n)?.[1] ?? '' };
}

async function captureSubmit(page: Page) {
  let body = '';
  await page.route('**/api.web3forms.com/**', async (route) => {
    body = route.request().postDataBuffer()?.toString('utf8') || '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  return async () => {
    await page.click('#contactForm button[type="submit"]');
    await expect.poll(() => body.length).toBeGreaterThan(0);
    return parse(body);
  };
}

async function finishContact(page: Page) {
  await page.fill('#contactName', 'Prueba Local');
  await page.fill('#contactPhone', '815-555-0100');
  await page.check('#ownerVerify');
  await page.selectOption('#bestTime', 'afternoon');
  await page.locator('#formLoadedAt').evaluate((input) => { (input as HTMLInputElement).value = String(Date.now() - 60000); });
}

for (const [lang, path, yardLine, rangePrefix, snowLine, treeLine] of [
  ['en', '/', 'Yard areas: The lawn', 'Instant estimate request:', 'Services: Snow Removal', 'Services: Tree Service'],
  ['es', '/es/', 'Áreas del jardín: El césped', 'Solicitud de presupuesto instantáneo:', 'Servicios: Remoción de nieve', 'Servicios: Servicio de árboles'],
] as const) {
  test.describe(`${lang}: choices carry into the request payload`, () => {
    test('the yard selection reaches service and message', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await page.fill('#contactAddress', '123 Main St, DeKalb, IL');
      await page.fill('#projectDetails', 'Front gate only.');
      await finishContact(page);
      const p = await submit();
      expect(p.names).toEqual(FIELDS);
      expect(p.get('service')).toBe('lawn-care');
      expect(p.get('message')).toBe(`${yardLine}\nFront gate only.`);
    });

    test('"Add this range to my request" carries the service, size, ZIP and range', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('#instant-quote details'); if (d) d.open = true; });
      await page.selectOption('#serviceType', 'tree-service');
      await page.selectOption('#propertySize', 'medium');
      await page.fill('#zipCode', '60115');
      await page.click('#calculateQuoteBtn');
      await expect(page.locator('#priceRange')).toHaveText('$280 - $420');
      await page.click('#sendEstimateBtn');
      await page.fill('#contactAddress', '123 Main St, DeKalb, IL');
      await finishContact(page);
      const p = await submit();
      expect(p.names).toEqual(FIELDS);
      expect(p.get('service')).toBe('tree-service');
      expect(p.get('message')).toContain(rangePrefix);
      expect(p.get('message')).toContain('ZIP 60115');
      expect(p.get('message')).toContain('$280 - $420');
    });

    test('the town chip fills the address the request sends', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.locator('[data-town="Sycamore"]').click();
      await expect(page.locator('#contactAddress')).toBeFocused();
      await page.keyboard.type('123 Main St');
      await page.selectOption('#contactService', 'lawn-care');
      await page.fill('#projectDetails', 'Mowing.');
      await finishContact(page);
      const p = await submit();
      expect(p.names).toEqual(FIELDS);
      expect(p.get('address')).toBe('123 Main St, Sycamore, IL');
    });

    test('all three together: range, yard and town in one request', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('#instant-quote details'); if (d) d.open = true; });
      await page.selectOption('#serviceType', 'tree-service');
      await page.selectOption('#propertySize', 'medium');
      await page.fill('#zipCode', '60115');
      await page.click('#calculateQuoteBtn');
      await page.click('#sendEstimateBtn');
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await page.locator('[data-town="Genoa"]').click();
      await page.keyboard.type('9 Oak Ave');
      await finishContact(page);
      const p = await submit();
      expect(p.names).toEqual(FIELDS);
      expect(p.get('address')).toBe('9 Oak Ave, Genoa, IL');
      expect(p.get('message').startsWith(`${treeLine} · ${yardLine}\n`)).toBe(true);
      expect(p.get('message')).toContain('$280 - $420');
      expect(p.get('service')).toBe('multiple-services');
    });

    // Codex review: an earlier service must stay named when a yard area turns the
    // request into "multiple services" (no notes, so the message is all there is).
    test('an earlier service stays named when a yard area makes it multiple services', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.selectOption('#contactService', 'snow-removal');
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await page.fill('#contactAddress', '123 Main St, DeKalb, IL');
      await finishContact(page);
      await expect(page.locator('#projectDetails')).toHaveValue('');
      const p = await submit();
      expect(p.names).toEqual(FIELDS);
      expect(p.get('service')).toBe('multiple-services');
      expect(p.get('message')).toBe(`${snowLine} · ${yardLine}`);
    });

    test('the earlier service line goes when the yard is cleared or the service is changed', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = await captureSubmit(page);
      await page.selectOption('#contactService', 'snow-removal');
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await expect(page.locator('#yardAreasField')).toHaveValue(`${snowLine} · ${yardLine}`);
      // cleared: the earlier service comes back and nothing extra is sent
      await page.locator('#yard-lawn').uncheck();
      await page.locator('[data-yard-cta]').click();
      await expect(page.locator('#contactService')).toHaveValue('snow-removal');
      await expect(page.locator('#yardAreasField')).toHaveValue('');
      // applied again, then the visitor picks a service by hand: the field says it now
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await page.selectOption('#contactService', 'landscaping');
      await expect(page.locator('#yardAreasField')).toHaveValue(yardLine);
      await page.fill('#contactAddress', '123 Main St, DeKalb, IL');
      await finishContact(page);
      const p = await submit();
      expect(p.get('service')).toBe('landscaping');
      expect(p.get('message')).toBe(yardLine);
    });

    test('an earlier service that a yard area already covers is not repeated', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.selectOption('#contactService', 'lawn-care');
      await page.locator('#yard-lawn').check();
      await page.locator('#yard-tree').check();
      await page.locator('[data-yard-cta]').click();
      await expect(page.locator('#contactService')).toHaveValue('multiple-services');
      await expect(page.locator('#yardAreasField')).not.toHaveValue(/Services:|Servicios:/);
    });

    test('clearing the yard gives the range\'s service back', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('#instant-quote details'); if (d) d.open = true; });
      await page.selectOption('#serviceType', 'tree-service');
      await page.selectOption('#propertySize', 'medium');
      await page.fill('#zipCode', '60115');
      await page.click('#calculateQuoteBtn');
      await page.click('#sendEstimateBtn');
      await expect(page.locator('#contactService')).toHaveValue('tree-service');
      await page.locator('#yard-lawn').check();
      await page.locator('[data-yard-cta]').click();
      await expect(page.locator('#contactService')).toHaveValue('multiple-services');
      await page.locator('#yard-lawn').uncheck();
      await page.locator('[data-yard-cta]').click();
      await expect(page.locator('#contactService')).toHaveValue('tree-service');
      await expect(page.locator('#projectDetails')).toHaveValue(/\$280 - \$420/);
    });

    test('sending straight from the price check carries the range too', async ({ page }) => {
      let body = '';
      await page.route('**/api.web3forms.com/**', async (route) => {
        body = route.request().postDataBuffer()?.toString('utf8') || '';
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('#instant-quote details'); if (d) d.open = true; });
      await page.selectOption('#serviceType', 'tree-service');
      await page.selectOption('#propertySize', 'medium');
      await page.fill('#zipCode', '60115');
      await page.fill('#instantName', 'Prueba Local');
      await page.fill('#instantPhone', '815-555-0100');
      await page.fill('#propertyAddress', '123 Main St, DeKalb');
      await page.check('#isOwner');
      await page.click('#sendInstantRequestBtn');
      await expect.poll(() => body.length).toBeGreaterThan(0);
      const p = parse(body);
      expect(p.names).toEqual(['access_key', 'subject', 'from_name', 'form_loaded_at', 'name', 'phone', 'email', 'address', 'service', 'best_time', 'message', 'botcheck', 'response_instructions']);
      expect(p.get('service')).toBe('tree-service');
      expect(p.get('message')).toContain('$280 - $420');
    });
  });
}
