import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

// Round 4 · Full /es/ parity (research 03 R5, 05 X3). /es/ is written in Spanish
// from index.html + i18n.js by scripts/build-es-home.mjs.

const sectionIds = (html: string) => [...html.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

const formContract = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('form')].map((form) => ({
      id: form.id,
      action: form.getAttribute('action') || '',
      method: (form.getAttribute('method') || '').toUpperCase(),
      fields: [...(form as HTMLFormElement).elements]
        .filter((el) => (el as HTMLInputElement).name)
        .map((el) => {
          const input = el as HTMLInputElement;
          const hiddenValue = input.type === 'hidden' && input.name !== 'form_loaded_at' ? `=${input.value}` : '';
          return `${input.name}:${input.type}${hiddenValue}${input.required ? '*' : ''}`;
        }),
    })),
  );

test('/es/ mirrors every home chapter, in order', async ({ request }) => {
  const en = sectionIds(await (await request.get('/')).text());
  const es = sectionIds(await (await request.get('/es/')).text());
  expect(en.length).toBeGreaterThanOrEqual(10);
  expect(es).toEqual(en);
});

test('/es/ has the same request forms: endpoint, fields, hidden values and required flags', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const en = await formContract(page);
  await page.goto('/es/', { waitUntil: 'domcontentloaded' });
  const es = await formContract(page);
  expect(en.length).toBe(2);
  expect(es).toEqual(en);
});

test('a Spanish request posts the same payload as an English one', async ({ page }) => {
  const posted: string[] = [];
  await page.route('**/api.web3forms.com/submit', async (route) => {
    const body = route.request().postData() || '';
    // Drop the per-visit timestamp; everything else must match byte for byte.
    posted.push(body.replace(/name="form_loaded_at"\r\n\r\n\d+/, 'name="form_loaded_at"\r\n\r\nT').replace(/-{2,}[\w-]+/g, '--B'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  for (const path of ['/', '/es/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.locator('#contactName').fill('Prueba Local');
    await page.locator('#contactPhone').fill('815-555-0100');
    await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
    await page.locator('#ownerVerify').check();
    await page.locator('#bestTime').selectOption('afternoon');
    await page.locator('#contactService').selectOption('lawn-care');
    await page.locator('#projectDetails').fill('Probe only.');
    await page.locator('#formLoadedAt').evaluate((input) => { (input as HTMLInputElement).value = String(Date.now() - 60000); });
    await page.locator('#contactForm button[type="submit"]').click();
    await expect.poll(() => posted.length).toBe(path === '/' ? 1 : 2);
  }
  expect(posted[1]).toBe(posted[0]);
});

test('the Spanish nav stays on Spanish URLs', async ({ page }) => {
  for (const route of ['/es/', '/es/lawn-care/', '/es/service-areas/malta-il/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('#header nav a:not([href^="tel:"]):not(.lang-link)').evaluateAll((links) => links.map((a) => a.getAttribute('href') || ''));
    expect(hrefs.length, route).toBeGreaterThanOrEqual(10);
    for (const href of hrefs) expect(href, `${route}: ${href}`).toMatch(/^(\/es\/|#)/);
  }
});

test('/es/ page links go to Spanish pages or say they are English', async ({ page }) => {
  await page.goto('/es/', { waitUntil: 'domcontentloaded' });
  const links = await page.locator('main a[href], footer a[href]').evaluateAll((anchors) =>
    anchors.map((a) => ({ href: a.getAttribute('href') || '', hreflang: a.getAttribute('hreflang') })),
  );
  for (const { href, hreflang } of links) {
    if (/^(#|\?|tel:|sms:|mailto:|https?:)/.test(href) || href.startsWith('/es/')) continue;
    expect(hreflang, href).toBe('en');
  }
  expect(links.some((l) => l.href === '/es/lawn-care/')).toBe(true);
});

test('English URLs stay English and link to /es/; old ?lang=es home links open /es/', async ({ page }) => {
  await page.goto('/gallery/?lang=es', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-lang-switch]')).toHaveCount(0);
  await expect(page.locator('#header .lang-link').first()).toHaveAttribute('href', '/es/#gallery');

  await page.goto('/?lang=es', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/es\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('[data-i18n-key="quote.formHeading"]')).toHaveText('Solicite una cotización gratis');

  for (const route of ['/', '/es/', '/es/lawn-care/', '/card.html', '/es/service-areas/genoa-il/']) {
    const html = await (await page.request.get(route)).text();
    expect(html, route).not.toContain('?lang=es');
  }
});
