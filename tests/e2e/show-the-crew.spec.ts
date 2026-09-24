import { expect, test } from './fixtures';

// Round 4 · "Show the crew, calm the weather": hero hierarchy, fold and photo.

test.describe('Hero: one clear ask and the number on every width', () => {
  test('phones: quote first, the call with its number, then the text links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const quote = page.locator('.hero-actions .primary-cta');
    await expect(quote).toHaveAttribute('href', '#quote');
    await expect(quote).toContainText('Get a free quote');
    const call = page.locator('.hero-actions a[href="tel:18155011478"]');
    await expect(call).toBeVisible();
    await expect(call).toContainText('(815) 501-1478');
    await expect(page.locator('a.hero-price-link[href="#instant-quote"]')).toBeVisible();
    await expect(page.locator('.hero-storm-link')).toBeVisible();
    await expect(page.locator('#home .emergency-strip')).toBeHidden();
    const box = await call.boundingBox();
    expect(box!.y + box!.height, 'call button inside the first 844px').toBeLessThanOrEqual(844);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('1366x768: calls above the fold, H1 capped, number in the header', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium' && testInfo.project.name !== 'chrome-local', 'Font metrics differ per engine.');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const quote = await page.locator('.hero-actions .primary-cta').boundingBox();
    expect(quote!.y + quote!.height).toBeLessThanOrEqual(768);
    const h1 = await page.locator('#home h1').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { size: parseFloat(cs.fontSize), lines: Math.round(el.getBoundingClientRect().height / parseFloat(cs.lineHeight)), animation: cs.animationName };
    });
    expect(h1.size).toBeLessThanOrEqual(72);
    expect(h1.lines).toBeLessThanOrEqual(3);
    expect(h1.animation, 'no opacity entrance on the LCP heading').toBe('none');
    await expect(page.locator('#header .header-tel')).toBeVisible();
    await expect(page.locator('#header .header-tel')).toHaveText('(815) 501-1478');
  });

  test('the full storm strip returns only in storm mode', async ({ page }) => {
    await page.route('**/assets/data/site-status.json', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: '{"storm":true}',
    }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home .emergency-strip')).toBeVisible();
    await expect(page.locator('.hero-storm-link')).toBeHidden();
  });

  test('phones see the crew photo as a clear band above the headline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const photo = await page.locator('#home picture img').boundingBox();
    const heading = await page.locator('#home h1').boundingBox();
    // At least 140px of photo shows between the header and the eyebrow/H1 block.
    expect(heading!.y - 76).toBeGreaterThanOrEqual(140 + 40);
    expect(photo!.y).toBeLessThanOrEqual(80);
  });
});

test.describe('Honest trust signals', () => {
  test('no rating stars or claim-shaped icons on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.fa-star, .fa-shield-alt, .fa-certificate')).toHaveCount(0);
    await expect(page.locator('[data-proof-rail] .fa-check')).toHaveCount(3);
  });

  for (const [path, label] of [
    ['/emergency-tree-removal/', 'Send a storm-damage request'],
    ['/tree-removal/', 'Send a storm-damage request'],
    ['/es/emergency-tree-removal/', 'Enviar solicitud de daños por tormenta'],
    ['/es/tree-removal/', 'Enviar solicitud de daños por tormenta'],
  ] as const) {
    test(`${path} asks for a storm-damage request, not a dispatch`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const submit = page.locator('form[data-emergency-dispatch] button[type="submit"]');
      await expect(submit).toHaveText(label);
      await expect(page.locator('body')).not.toContainText(/Emergency Dispatch|despacho de emergencia/);
    });
  }
});

test.describe('Quote form friction', () => {
  const required = ['contactName', 'contactPhone', 'contactAddress', 'ownerVerify', 'bestTime', 'contactService', 'projectDetails'];

  test('an empty send shows inline errors beside each field, focuses the first, and no modal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#contactForm button[type="submit"]').click();
    for (const id of required) {
      await expect(page.locator(`#${id}`), id).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator(`#${id}Error`), id).toBeVisible();
      await expect(page.locator(`#${id}`)).toHaveAttribute('aria-describedby', new RegExp(`${id}Error`));
    }
    await expect(page.locator('#contactEmailError')).toBeHidden();
    await expect(page.locator('#customModal')).toBeHidden();
    await expect(page.locator('#contactName')).toBeFocused();
    await expect(page.locator('#contactNameError')).toHaveText('Please enter your name.');
    await page.locator('#contactName').fill('Prueba Local');
    await expect(page.locator('#contactNameError')).toBeHidden();
    await expect(page.locator('#contactName')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('messages follow the language (usted)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-lang-switch="es"]:visible').first().click();
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactNameError')).toHaveText('Escriba su nombre.');
    await expect(page.locator('#bestTimeError')).toHaveText('Elija un horario para la llamada.');
    await page.locator('[data-lang-switch="en"]:visible').first().click();
    await expect(page.locator('#contactNameError')).toHaveText('Please enter your name.');
  });

  test('required and optional fields are both marked; no placeholder repeats a label', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const id of required) {
      await expect(page.locator(`label[for="${id}"] .field-tag:visible`), id).toHaveText('(required)');
    }
    await expect(page.locator('label[for="contactEmail"]')).toContainText('(optional)');
    for (const id of ['contactName', 'contactPhone', 'contactEmail', 'contactAddress', 'projectDetails']) {
      await expect(page.locator(`#${id}`), id).not.toHaveAttribute('placeholder', /.+/);
    }
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await expect(page.locator('label[for="projectDetails"] .field-tag:visible')).toHaveText('(optional)');
  });

  test('town chips prefill the town and show the matching existing policy line', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const address = page.locator('#contactAddress');
    await page.locator('.town-chip[data-town="Sycamore"]').click();
    await expect(address).toHaveValue(', Sycamore, IL');
    await expect(address).toBeFocused();
    await expect(page.locator('[data-town-policy="primary"]')).toBeVisible();
    await expect(page.locator('[data-town-policy="outlying"]')).toBeHidden();
    await page.keyboard.type('123 Example Street');
    await expect(address).toHaveValue('123 Example Street, Sycamore, IL');
    await page.locator('.town-chip[data-town="Genoa"]').click();
    await expect(address).toHaveValue('123 Example Street, Genoa, IL');
    await expect(page.locator('[data-town-policy="outlying"]')).toBeVisible();
    await expect(page.locator('.town-chip[data-town="Genoa"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.town-chip[data-town=""]').click();
    await expect(address).toHaveValue('123 Example Street');
    const names = await page.locator('#contactForm [data-town-start] [name]').count();
    expect(names, 'chips add no form fields').toBe(0);
  });

  test('photos can be texted to the existing number', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const sms = page.locator('#contactForm .sms-photos a');
    await expect(sms).toHaveAttribute('href', 'sms:+18155011478');
    await expect(page.locator('#contactForm .sms-photos')).toContainText('Or text photos of the job to (815) 501-1478');
  });

  test('the mobile bar waits until the hero call button has scrolled away', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const bar = page.locator('[data-mobile-call-cta]');
    await expect(bar).not.toBeVisible();
    const callBottom = await page.locator('.hero-actions a[href^="tel:"]').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y + 20), callBottom);
    await expect(bar).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-mobile-call-cta]')!).fontFamily)).toContain('Public Sans');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).not.toBeVisible();
  });
});
