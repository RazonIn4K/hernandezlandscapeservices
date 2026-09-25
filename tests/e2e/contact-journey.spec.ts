import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

// Round 5 · J1 contact-journey audit (LUXE-CRAFT-BAR J1). Every submission is
// intercepted; nothing reaches Web3Forms.

const PHONE_TEL = 'tel:18155011478';
const PHONE_SMS = 'sms:+18155011478';

async function fillRequest(page: Page) {
  await page.fill('#contactName', 'Prueba Local');
  await page.fill('#contactPhone', '815-555-0100');
  await page.fill('#contactAddress', '123 Example Street, DeKalb');
  await page.check('#ownerVerify');
  await page.selectOption('#bestTime', 'afternoon');
  await page.selectOption('#contactService', 'lawn-care');
  await page.fill('#projectDetails', 'Test only.');
  await page.locator('#formLoadedAt').evaluate((input) => { (input as HTMLInputElement).value = String(Date.now() - 60000); });
}

for (const [lang, path, callLabel, textLabel] of [
  ['en', '/', 'Call (815) 501-1478', 'Send a Text'],
  ['es', '/es/', 'Llame al (815) 501-1478', 'Enviar un mensaje de texto'],
] as const) {
  test(`${lang}: a failed request offers Call and Text, for the form and the price-check send`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api.web3forms.com/**', (route) => route.abort('internetdisconnected'));
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await fillRequest(page);
    await page.click('#contactForm button[type="submit"]');
    const call = page.locator('#modalCallAction');
    const text = page.locator('#modalTextAction');
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute('href', PHONE_TEL);
    await expect(call).toHaveText(callLabel);
    await expect(text).toBeVisible();
    await expect(text).toHaveAttribute('href', PHONE_SMS);
    await expect(text).toHaveText(textLabel);
    expect((await call.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.locator('#customModal button').click();

    await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('#instant-quote details'); if (d) d.open = true; });
    await page.selectOption('#serviceType', 'tree-service');
    await page.selectOption('#propertySize', 'medium');
    await page.fill('#zipCode', '60115');
    await page.fill('#instantName', 'Prueba Local');
    await page.fill('#instantPhone', '815-555-0100');
    await page.fill('#propertyAddress', '123 Example Street, DeKalb');
    await page.check('#isOwner');
    await page.click('#sendInstantRequestBtn');
    await expect(call).toBeVisible();
    await expect(text).toBeVisible();
  });

  test(`${lang}: a successful request shows no failure actions`, async ({ page }) => {
    await page.route('**/api.web3forms.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await fillRequest(page);
    await page.click('#contactForm button[type="submit"]');
    await expect(page.locator('#modalMessage')).toBeVisible();
    await expect(page.locator('#modalCallAction')).toBeHidden();
    await expect(page.locator('#modalTextAction')).toBeHidden();
  });
}

test('the storm request failure offers a text as well as the call', async ({ page }) => {
  await page.route('**/api.web3forms.com/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
  for (const path of ['/emergency-tree-removal/', '/es/emergency-tree-removal/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.fill('#emergencyName', 'Prueba Local');
    await page.fill('#emergencyPhone', '815-555-0100');
    await page.fill('#emergencyLocation', '60115');
    await page.selectOption('#emergencyType', 'fallen-tree');
    await page.click('#emergencyDispatchForm button[type="submit"]');
    const status = page.locator('[data-dispatch-status]');
    await expect(status.locator(`a[href="${PHONE_TEL}"]`)).toHaveText('(815) 501-1478');
    await expect(status.locator(`a[href="${PHONE_SMS}"]`)).toBeVisible();
  }
});

test('every tel: and sms: link is (815) 501-1478 and any number it shows matches', async ({ page }) => {
  for (const path of ['/', '/es/', '/lawn-care/', '/es/lawn-care/', '/service-areas/sycamore-il/', '/es/service-areas/sycamore-il/', '/gallery/', '/videos/', '/emergency-tree-removal/', '/es/emergency-tree-removal/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const bad = await page.locator('a[href^="tel:"], a[href^="sms:"]').evaluateAll((links) =>
      links
        .map((a) => {
          const href = a.getAttribute('href') || '';
          const shown = `${a.textContent} ${a.getAttribute('aria-label') || ''}`.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [];
          const ok = href.replace(/\D/g, '') === '18155011478' && shown.every((s) => `1${s.replace(/\D/g, '')}` === '18155011478');
          return ok ? '' : `${href} "${(a.textContent || '').trim()}"`;
        })
        .filter(Boolean),
    );
    expect(bad, path).toEqual([]);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test('every page has a call on the first screen and no control that needs JavaScript', async ({ page }) => {
    for (const path of ['/', '/es/', '/lawn-care/', '/es/lawn-care/', '/gallery/', '/videos/', '/service-areas/sycamore-il/', '/emergency-tree-removal/', '/es/emergency-tree-removal/']) {
      await page.goto(path, { waitUntil: 'load' });
      const call = page.locator('#header .nojs-call');
      await expect(call, path).toBeVisible();
      await expect(call).toHaveAttribute('href', PHONE_TEL);
      expect((await call.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(page.locator('#mobileMenuButton'), path).toBeHidden();
      await expect(page.locator('[data-geo-request]')).toHaveCount(await page.locator('[data-geo-request]:not(:visible)').count());
    }
  });

  test('the price check points to call, text and the request form instead of a dead button', async ({ page }) => {
    for (const path of ['/', '/es/']) {
      await page.goto(path, { waitUntil: 'load' });
      await expect(page.locator('#quoteForm'), path).toBeHidden();
      const note = page.locator('.price-check-nojs');
      await expect(note, path).toBeVisible();
      await expect(note.locator(`a[href="${PHONE_TEL}"]`)).toBeVisible();
      await expect(note.locator(`a[href="${PHONE_SMS}"]`)).toBeVisible();
      await expect(note.locator('a[href="#quoteFormCard"]')).toBeVisible();
      await expect(page.locator('#contactForm')).toHaveAttribute('action', 'https://api.web3forms.com/submit');
    }
  });
});
