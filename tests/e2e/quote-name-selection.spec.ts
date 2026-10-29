import { expect, test } from './fixtures';

for (const [route, summary] of [
  ['/', 'Selected service: Multiple Services'],
  ['/es/', 'Servicio seleccionado: Múltiples servicios'],
] as const) {
  test(`${route} accepts a one-character name and submits it unchanged`, async ({ page }) => {
    let requestBody = '';
    await page.route('**/api.web3forms.com/**', async route => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.locator('#contactName').pressSequentially('J');
    await page.locator('#contactName').blur();
    await expect(page.locator('#contactName')).not.toHaveAttribute('aria-invalid', 'true');
    await page.locator('#contactPhone').fill('815-555-0100');
    await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
    await page.locator('#ownerVerify').check();
    await page.locator('#bestTime').selectOption('afternoon');
    await page.locator('#contactService').selectOption('multiple-services');
    await page.locator('#projectDetails').fill('Test request only.');
    await page.locator('#formLoadedAt').evaluate(input => { (input as HTMLInputElement).value = String(Date.now() - 60000); });
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#modalMessage')).toBeVisible();
    expect(requestBody).toMatch(/name="name"\r\n\r\nJ\r\n/);
  });

  test(`${route} exposes the full selected service at enlarged text and clears on reset`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    const display = page.locator('#selectedServiceDisplay');
    await expect(display).toBeHidden();
    await page.locator('#contactService').selectOption('multiple-services');
    await expect(display).toHaveText(summary);
    await expect(display).toBeVisible();
    await expect(display).toHaveAttribute('aria-hidden', 'true');
    expect(await display.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    await page.locator('#contactService').selectOption('lawn-care');
    await expect(display).not.toHaveText(summary);
    await page.locator('#contactForm').evaluate(form => (form as HTMLFormElement).reset());
    await expect(display).toBeHidden();
  });
}

test.describe('name fields without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const route of ['/', '/es/']) {
    test(`${route} accepts one character in both quote paths`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      for (const id of ['contactName', 'instantName']) {
        const field = page.locator(`#${id}`);
        await expect(field).not.toHaveAttribute('minlength', '2');
        expect(await field.evaluate((el: HTMLInputElement) => { el.value = 'J'; return el.validity.valid; })).toBeTruthy();
      }
    });
  }
});

for (const [route, expected] of [
  ['/?service=tree-service#quote', 'Selected service: Tree Service'],
  ['/es/?service=tree-service#quote', 'Servicio seleccionado: Servicio de árboles'],
] as const) {
  test(`${route} shows the selected service after a URL prefill and yard update`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#selectedServiceDisplay')).toHaveText(expected);
    await page.locator('label[for="yard-lawn"]').click();
    await page.locator('[data-yard-cta]').click();
    await expect(page.locator('#contactService')).toHaveValue('multiple-services');
    await expect(page.locator('#selectedServiceDisplay')).toHaveText(route.startsWith('/es/') ? 'Servicio seleccionado: Múltiples servicios' : 'Selected service: Multiple Services');
  });
}

test.describe('service summary without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const [route, summary] of [
    ['/', 'Selected service: Pressure Washing'],
    ['/es/', 'Servicio seleccionado: Lavado a presión'],
  ] as const) {
    test(`${route} shows the full choice at 200% zoom and keeps controls inside the card`, async ({ page }) => {
      await page.setViewportSize({ width: 195, height: 800 });
      await page.goto(route, { waitUntil: 'load' });
      const fallback = page.locator('.quote-selection-fallback');
      await expect(fallback.locator('span[data-service]:visible')).toHaveCount(0);
      await page.locator('#contactService').selectOption('pressure-washing');
      const shown = fallback.locator('span[data-service]:visible');
      await expect(shown).toHaveCount(1);
      await expect(shown).toHaveText(summary);
      const escaped = await page.locator('#quoteFormCard').evaluate(card => {
        const box = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        const left = box.left + parseFloat(style.paddingLeft);
        const right = box.right - parseFloat(style.paddingRight);
        return [...card.querySelectorAll('input, select, textarea, button')]
          .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < left - 1 || r.right > right + 1); })
          .map(el => el.id || el.textContent?.trim());
      });
      expect(escaped).toEqual([]);
    });
  }
});

test('the CSS-only service summary stays hidden when JavaScript is enabled', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#contactService').selectOption('pressure-washing');
  await expect(page.locator('.quote-selection-fallback')).toBeHidden();
  await expect(page.locator('#selectedServiceDisplay')).toHaveText('Selected service: Pressure Washing');
});
