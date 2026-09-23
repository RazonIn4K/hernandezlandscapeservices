import { expect, test } from '@playwright/test';

test('yard picker prefills one service and reconciles changes without losing visitor text', async ({ page }) => {
  await page.goto('/');
  const lawn = page.locator('#yard-lawn');
  const tree = page.locator('#yard-tree');
  const add = page.locator('[data-yard-cta]');

  await lawn.check();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#quotePrefillNotice')).toBeVisible();

  await page.locator('#projectDetails').fill('Please call before visiting.');
  await tree.check();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#projectDetails')).toHaveValue(/Yard areas: The big tree, The lawn/);

  await tree.uncheck();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#projectDetails')).toHaveValue('Please call before visiting.');

  await lawn.uncheck();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('');
  await expect(page.locator('#projectDetails')).toHaveValue('Please call before visiting.');
});

test('Spanish landing page carries selected yard areas into the Spanish quote form', async ({ page }) => {
  await page.goto('/es/?month=8');
  await expect(page.locator('[data-ring-month]')).toHaveText('septiembre');
  await page.locator('#yard-tree').check();
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();

  await expect(page).toHaveURL(/\/\?lang=es&yard=tree-service%2Clawn-care#quote$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#projectDetails')).toHaveValue(/Áreas del jardín: El árbol grande, El césped/);
});

test('storm notice appears on standalone pages and fails closed when status cannot be read', async ({ page }) => {
  await page.route('**/assets/data/site-status.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{"storm":true}',
  }));
  await page.goto('/privacy.html');
  await expect(page.locator('[data-storm-band]')).toBeVisible();
  await expect(page.locator('[data-storm-band] a[href="tel:18155011478"]')).toBeVisible();

  await page.unroute('**/assets/data/site-status.json');
  await page.route('**/assets/data/site-status.json', (route) => route.abort());
  await page.reload();
  await expect(page.locator('[data-storm-band]')).toHaveCount(0);
});
