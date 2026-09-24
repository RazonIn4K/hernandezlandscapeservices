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
  await expect(page.locator('#yardSelectionNotice')).toBeVisible();
  await expect(page.locator('#yardSelectionText')).toHaveText('The lawn');
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The lawn');
  await expect(page.locator('#projectDetails')).toHaveValue('');
  await expect(page.locator('#projectDetails')).not.toHaveAttribute('required');
  await expect(page).toHaveURL(/#quoteFormCard$/);
  expect(await page.evaluate(() => new FormData(document.querySelector<HTMLFormElement>('#contactForm')!).get('yard_areas'))).toBe('Yard areas: The lawn');

  await page.locator('#projectDetails').fill('Please call before visiting. Front yard only.');
  await tree.check();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The big tree, The lawn');
  await expect(page.locator('#projectDetails')).toHaveValue('Please call before visiting. Front yard only.');
  await add.click();
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The big tree, The lawn');

  await tree.uncheck();
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The lawn');
  await expect(page.locator('#projectDetails')).toHaveValue('Please call before visiting. Front yard only.');

  await lawn.uncheck();
  await expect(add).toContainText('Start a quote request');
  await add.click();
  await expect(page.locator('#contactService')).toHaveValue('');
  await expect(page.locator('#yardAreasField')).toHaveValue('');
  await expect(page.locator('#yardSelectionNotice')).toBeHidden();
  await expect(page.locator('#projectDetails')).toHaveValue('Please call before visiting. Front yard only.');
  await expect(page.locator('#projectDetails')).toHaveAttribute('required', '');
});

test('mobile yard CTA lands on the quote form and shows the selected area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();

  await expect(page).toHaveURL(/#quoteFormCard$/);
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#yardSelectionNotice')).toBeVisible();
  await expect.poll(async () => page.locator('#quoteFormCard').evaluate((card) => {
    const header = document.getElementById('header');
    const top = card.getBoundingClientRect().top;
    return top >= (header?.getBoundingClientRect().height || 0) - 4 && top < 240;
  })).toBe(true);
  const notice = await page.locator('#quotePrefillNotice').boundingBox();
  expect(notice?.y).toBeLessThan(900);
});

test('yard picker still fills a single service if the main script is unavailable', async ({ page }) => {
  await page.route('**/assets/js/main.js*', (route) => route.abort());
  await page.goto('/');
  await page.locator('#yard-tree').check();
  await page.locator('[data-yard-cta]').click();

  await expect(page.locator('#contactService')).toHaveValue('tree-service');
  await expect(page.locator('#yardAreasField')).toHaveValue('Yard areas: The big tree');
  await expect(page.locator('#projectDetails')).toHaveValue('');
});

test('manual service edits survive clearing the yard picker, and reset clears picker state', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();
  await page.locator('#contactService').selectOption('landscaping');
  await page.locator('#yard-lawn').uncheck();
  await page.locator('[data-yard-cta]').click();
  await expect(page.locator('#contactService')).toHaveValue('landscaping');
  await expect(page.locator('#projectDetails')).toHaveValue('');

  await page.locator('#yard-tree').check();
  await page.locator('[data-yard-cta]').click();
  await page.locator('#contactForm').evaluate((form: HTMLFormElement) => form.reset());
  await expect(page.locator('#yard-tree')).not.toBeChecked();
  await expect(page.locator('[data-yard-count]')).toHaveText('Nothing selected yet');
  await expect(page.locator('#quotePrefillNotice')).toBeHidden();
  await expect(page.locator('#yardSelectionNotice')).toBeHidden();
  await expect(page.locator('#yardAreasField')).toHaveValue('');
});

test('language changes translate the last applied yard areas without adding pending picks', async ({ page }) => {
  await page.goto('/');
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();
  await page.locator('#yard-tree').check();
  await page.locator('nav [data-lang-switch="es"]:visible').first().click();

  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#yardAreasField')).toHaveValue('Áreas del jardín: El césped');
  await page.locator('[data-yard-cta]').click();
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#yardAreasField')).toHaveValue('Áreas del jardín: El árbol grande, El césped');
});

test('submitted request includes only the last applied areas and preserves visitor details', async ({ page }) => {
  let posted = '';
  await page.route('**/api.web3forms.com/submit', async (route) => {
    posted = route.request().postData() || '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto('/');
  await page.locator('#yard-tree').check();
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();
  await page.locator('#projectDetails').fill('Please call first. Front gate only.');
  await page.locator('#yard-lawn').uncheck();
  await page.locator('#yard-gutters').check();
  await page.locator('[data-yard-cta]').click();

  await page.locator('#contactName').fill('Prueba Local');
  await page.locator('#contactPhone').fill('815-555-0100');
  await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
  await page.locator('#ownerVerify').check();
  await page.locator('#bestTime').selectOption('afternoon');
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60000);
  });
  await page.locator('#contactForm button[type="submit"]').click();

  await expect(page.locator('#modalMessage')).toContainText('estimate request was sent');
  expect(posted).toContain('Yard areas: The big tree, Gutters');
  expect(posted).toContain('Please call first. Front gate only.');
  expect(posted).not.toContain('Yard areas: The big tree, The lawn');
  expect(posted).not.toContain('name="yard_areas"');
});

test('picker areas alone can supply the project description for submission', async ({ page }) => {
  let posted = '';
  await page.route('**/api.web3forms.com/submit', async (route) => {
    posted = route.request().postData() || '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto('/');
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();
  await expect(page.locator('#projectDetails')).toHaveValue('');
  await expect(page.locator('#projectDetails')).not.toHaveAttribute('required');

  await page.locator('#contactName').fill('Prueba Local');
  await page.locator('#contactPhone').fill('815-555-0100');
  await page.locator('#contactAddress').fill('123 Example Street, DeKalb');
  await page.locator('#ownerVerify').check();
  await page.locator('#bestTime').selectOption('afternoon');
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60000);
  });
  await page.locator('#contactForm button[type="submit"]').click();

  await expect(page.locator('#modalMessage')).toContainText('estimate request was sent');
  expect(posted).toContain('Yard areas: The lawn');
  expect(posted).not.toContain('name="yard_areas"');
});

test('Spanish landing page carries selected yard areas into the Spanish quote form', async ({ page }) => {
  await page.goto('/es/?month=8');
  await expect(page.locator('[data-ring-month]')).toHaveText('septiembre');
  await page.locator('#yard-tree').check();
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();

  await expect(page).toHaveURL(/\/\?lang=es&yard=tree-service%2Clawn-care#quoteFormCard$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await expect(page.locator('#yardAreasField')).toHaveValue('Áreas del jardín: El árbol grande, El césped');
  await expect(page.locator('#yardSelectionNotice')).toBeVisible();
});

test('Spanish single-area transfer keeps the picker and submitted message in sync', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/es/');
  await page.locator('#yard-lawn').check();
  await page.locator('[data-yard-cta]').click();

  await expect(page).toHaveURL(/\/\?lang=es&service=lawn-care&yard=lawn-care#quoteFormCard$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#yard-lawn')).toBeChecked();
  await expect(page.locator('#contactService')).toHaveValue('lawn-care');
  await expect(page.locator('#yardAreasField')).toHaveValue('Áreas del jardín: El césped');
  await expect(page.locator('#yardSelectionText')).toHaveText('El césped');
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
