import { expect, test } from '@playwright/test';

test('gallery photos have visible context in English and Spanish', async ({ page }) => {
  for (const [route, language, caption] of [
    ['/gallery/', 'en', 'Stone fire pit with a light gravel border, lawn, and dark planting beds.'],
    ['/es/gallery/', 'es', 'Fogatero de piedra con borde de grava clara, césped y jardineras oscuras.'],
  ]) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('.gallery-item')).toHaveCount(18);
    await expect(page.locator('.gallery-caption p').first()).toHaveText(caption);
    await expect(page.locator('.gallery-caption p').first()).toBeVisible();
  }
});

test('Spanish gallery keeps the quote, language switch, and comparison control usable', async ({ page }) => {
  await page.goto('/es/gallery/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hernandezlandscapeservices.com/es/gallery/');
  await expect(page.locator('#header .lang-link').first()).toHaveAttribute('href', '/gallery/');
  await expect(page.locator('#header .header-cta')).toHaveAttribute('href', '/es/#quote');
  await expect(page.locator('.gallery-item img').first()).toHaveAttribute('alt', /Fogatero de piedra/);

  const slider = page.getByRole('slider', { name: 'Mostrar la foto del después' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Divisor de comparación al 55%');
});

test('Spanish homepage gallery links open the Spanish gallery', async ({ page }) => {
  await page.goto('/es/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a.proof-link[href="/es/gallery/"]')).toBeVisible();
  await expect(page.locator('#header a[aria-current="page"]')).toHaveCount(0);
  await page.locator('a.proof-link[href="/es/gallery/"]').click();
  await expect(page).toHaveURL(/\/es\/gallery\/$/);
});
