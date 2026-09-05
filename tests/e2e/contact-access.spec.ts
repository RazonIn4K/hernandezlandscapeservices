import { expect, test } from './fixtures';

test('Spanish entry opens a localized request and keeps the selected service', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/es/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jardinería');
  await expect(page.getByRole('link', { name: 'Llamar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enviar mensaje', exact: true })).toBeVisible();
  await page.locator('a[href="/?lang=es&service=lawn-care#quote"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('[data-i18n-key="quote.formHeading"]')).toHaveText('Solicita una cotización gratis');
  await expect(page.locator('#quoteFormHelper')).toContainText('no una cita confirmada');
  await expect(page.locator('#instantBestTime option')).toHaveText(['Mañana', 'Tarde', 'Noche']);
  await expect(page.locator('#bestTime option:not([value=""])')).toHaveText(['Mañana', 'Tarde', 'Noche']);

  await page.locator('[data-lang-switch="en"]:visible').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#quoteFormHelper')).toContainText('not a confirmed appointment');
});

test('quote heading has readable contrast and each contact action uses its own protocol', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#quote');
    const heading = page.locator('[data-i18n-key="quote.formHeading"]');
    const contrast = await heading.evaluate((element) => {
      const luminance = (color: string) => {
        const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(getComputedStyle(element.parentElement!).backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(contrast, `heading contrast at ${width}px`).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('#quote a[href="tel:18155011478"]')).toBeVisible();
    await expect(page.locator('#quote a[href="sms:+18155011478"]')).toBeVisible();
    await expect(page.locator('#quote a[href="mailto:hernandezlandscapetreeservices@gmail.com"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('a sent Spanish request does not claim an appointment or callback deadline', async ({ page }) => {
  let submitted = false;
  await page.route('**/api.web3forms.com/**', async (route) => {
    submitted = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/?lang=es#quote');
  await page.locator('#contactName').fill('Prueba Local');
  await page.locator('#contactPhone').fill('815-555-0100');
  await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
  await page.locator('#ownerVerify').check();
  await page.locator('#bestTime').selectOption('afternoon');
  await page.locator('#contactService').selectOption('lawn-care');
  await page.locator('#projectDetails').fill('Solicito una cotización para cortar el césped.');
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60000);
  });
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#modalMessage')).toContainText('Tu cita aún no está confirmada');
  await expect(page.locator('#modalMessage')).not.toContainText('24 horas');
  expect(submitted).toBe(true);
});
