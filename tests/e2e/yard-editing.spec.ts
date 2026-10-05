import { expect, test } from './fixtures';

for (const [language, path, lawn, tree, beds, prefix, snow, cleared] of [
  ['en', '/', 'The lawn', 'The big tree', 'Garden beds', 'Yard areas', 'Services: Snow Removal', 'Yard areas cleared from this request.'],
  ['es', '/es/', 'El césped', 'El árbol grande', 'Jardineras', 'Áreas del jardín', 'Servicios: Remoción de nieve', 'Se quitaron las áreas del jardín de esta solicitud.'],
] as const) {
  test(`${language}: adding areas clears an earlier error on optional project details`, async ({ page }) => {
    await page.goto(path);
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#projectDetailsError')).toBeVisible();
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await expect(page.locator('#projectDetails')).not.toHaveAttribute('required');
    await expect(page.locator('#projectDetails')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#projectDetailsError')).toBeHidden();
    await expect(page.locator('[data-project-opt]')).toBeVisible();
  });

  test(`${language}: added areas can be edited from the form, then cleared without losing the draft`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${path}?utm_source=yard-edit-test`);
    await page.locator('#contactName').fill('Draft Visitor');
    await page.locator('#contactPhone').fill('815-555-0100');
    await page.locator('#contactAddress').fill('123 Main St, DeKalb, IL');
    await page.locator('#projectDetails').fill('Please use the side gate.');
    await page.locator('#yard-lawn').check();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#yardSelectionNotice')).toBeHidden();
    await expect(page.locator('[data-yard-cta]')).toContainText(language === 'en' ? 'Add to my quote request' : 'Agregar a mi solicitud');
    await page.locator('[data-yard-cta]').click();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${lawn}`);
    await expect(page.locator('[data-yard-cta]')).toContainText(language === 'en' ? 'Review my quote request' : 'Revisar mi solicitud');

    await page.locator('[data-yard-edit]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#walk-title')).toBeFocused();
    await expect(page.locator('#walk-title')).toBeInViewport();
    await expect(page).toHaveURL(new RegExp(`\\?utm_source=yard-edit-test#walk-your-yard$`));
    await expect.poll(() => page.locator('#walk-title').evaluate((heading) =>
      heading.getBoundingClientRect().top >= (document.getElementById('header')?.getBoundingClientRect().height || 0),
    )).toBe(true);
    await page.locator('#yard-tree').check();
    await expect(page.locator('#yardSelectionText')).toHaveText(`${tree}, ${lawn}`);
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${tree}, ${lawn}`);
    await expect(page.locator('#contactService')).toHaveValue('multiple-services');
    await expect(page.locator('#yardSelectionStatus')).toContainText(`${tree}, ${lawn}`);
    await page.locator('#yard-tree').uncheck();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${lawn}`);
    await expect(page.locator('#contactService')).toHaveValue('lawn-care');

    await page.locator('[data-yard-clear]').click();
    await expect(page.locator('#quoteFormCard')).toBeFocused();
    await expect(page.locator('#yardSelectionNotice')).toBeHidden();
    await expect(page.locator('#yardSelectionStatus')).toHaveText(cleared);
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#contactService')).toHaveValue('');
    await expect(page.locator('#yard-lawn')).not.toBeChecked();
    await expect(page.locator('.zone.is-on')).toHaveCount(0);
    await expect(page.locator('#projectDetails')).toHaveAttribute('required', '');
    await expect(page.locator('#projectDetails')).toHaveValue('Please use the side gate.');
    await expect(page.locator('#contactName')).toHaveValue('Draft Visitor');
    await expect(page.locator('#contactPhone')).toHaveValue('815-555-0100');
    await expect(page.locator('#contactAddress')).toHaveValue('123 Main St, DeKalb, IL');
  });

  test(`${language}: editing retains a named earlier service and clearing restores it`, async ({ page }) => {
    await page.goto(path);
    await page.locator('#contactService').selectOption('snow-removal');
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await page.locator('#yard-tree').check();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${snow} · ${prefix}: ${tree}, ${lawn}`);
    await expect(page.locator('#contactService')).toHaveValue('multiple-services');
    await page.locator('#yard-lawn').uncheck();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${snow} · ${prefix}: ${tree}`);
    await page.locator('[data-yard-clear]').click();
    await expect(page.locator('#contactService')).toHaveValue('snow-removal');
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#projectDetails')).toHaveAttribute('required', '');
    await expect(page.locator('#yard-tree')).not.toBeChecked();
    await page.locator('#yard-lawn').check();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#contactService')).toHaveValue('snow-removal');
  });

  test(`${language}: applied edits and another Add retain a service changed in the form`, async ({ page }) => {
    await page.goto(path);
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await page.locator('#contactService').selectOption('landscaping');
    await page.locator('#yard-tree').check();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${tree}, ${lawn}`);
    await expect(page.locator('#contactService')).toHaveValue('landscaping');
    await page.locator('#yard-lawn').uncheck();
    await page.locator('[data-yard-cta]').click();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${tree}`);
    await expect(page.locator('#contactService')).toHaveValue('landscaping');
    await page.locator('[data-yard-clear]').click();
    await expect(page.locator('#contactService')).toHaveValue('landscaping');
    await expect(page.locator('#yardAreasField')).toHaveValue('');
  });

  test(`${language}: removing every applied area restores the earlier service immediately`, async ({ page }) => {
    await page.goto(path);
    await page.locator('#contactService').selectOption('snow-removal');
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await page.locator('#yard-lawn').uncheck();
    await expect(page.locator('#contactService')).toHaveValue('snow-removal');
    await expect(page.locator('#yardSelectionNotice')).toBeHidden();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#projectDetails')).toHaveAttribute('required', '');
    await expect(page.locator('#yardSelectionStatus')).toHaveText(cleared);
  });

  test(`${language}: editing and clearing transferred areas keeps a reload from restoring old picks`, async ({ page }) => {
    await page.goto(`${path}?yard=lawn-care&utm_source=yard-edit-test#quoteFormCard`);
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${lawn}`);
    await page.locator('#yard-tree').check();
    await page.locator('#yard-lawn').uncheck();
    expect(new URL(page.url()).searchParams.get('yard')).toBe('tree-service');
    await page.reload();
    await expect(page.locator('#yard-tree')).toBeChecked();
    await expect(page.locator('#yard-lawn')).not.toBeChecked();
    await expect(page.locator('#yardAreasField')).toHaveValue(`${prefix}: ${tree}`);
    await page.locator('[data-yard-clear]').click();
    expect(new URL(page.url()).searchParams.has('yard')).toBe(false);
    expect(new URL(page.url()).searchParams.get('utm_source')).toBe('yard-edit-test');
    await page.reload();
    await expect(page.locator('#yardSelectionNotice')).toBeHidden();
    await expect(page.locator('#yard-tree')).not.toBeChecked();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
  });

  test(`${language}: a successful intercepted request sends the edited areas and resets the picker`, async ({ page }) => {
    let posted = '';
    await page.route('**/api.web3forms.com/**', async (route) => {
      posted = route.request().postDataBuffer()?.toString('utf8') || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto(path);
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await page.locator('#yard-beds').check();
    await page.locator('#yard-lawn').uncheck();
    await page.locator('#contactName').fill('Prueba Local');
    await page.locator('#contactPhone').fill('815-555-0100');
    await page.locator('#contactAddress').fill('123 Main St, DeKalb, IL');
    await page.locator('#ownerVerify').check();
    await page.locator('#bestTime').selectOption('afternoon');
    await page.locator('#formLoadedAt').evaluate((input) => {
      (input as HTMLInputElement).value = String(Date.now() - 60000);
    });
    await page.locator('#contactForm button[type="submit"]').click();
    await expect.poll(() => posted.length).toBeGreaterThan(0);
    expect(posted).toContain(`${prefix}: ${beds}`);
    expect(posted).not.toContain(`${prefix}: ${lawn}`);
    expect(posted).toMatch(/name="service"\r\n\r\nlandscaping\r\n/);
    await expect(page.locator('#yard-beds')).not.toBeChecked();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#yardSelectionNotice')).toBeHidden();
    await expect(page.locator('#yardSelectionStatus')).toBeEmpty();
    await expect(page.locator('#projectDetails')).toHaveAttribute('required', '');
    await page.locator('#customModal button').click();
    await page.locator('#yard-tree').check();
    await expect(page.locator('#yardAreasField')).toHaveValue('');
    await expect(page.locator('#contactService')).toHaveValue('');
  });
}
