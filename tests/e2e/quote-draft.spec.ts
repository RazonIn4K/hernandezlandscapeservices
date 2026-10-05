import { expect, test } from './fixtures';

for (const [language, path, yardLine] of [
  ['en', '/', 'Yard areas: The lawn'],
  ['es', '/es/', 'Áreas del jardín: El césped'],
] as const) {
  test(`${language}: a service quote link preserves the draft and campaign parameters`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${path}?utm_source=local-test&utm_campaign=fall`);
    await page.locator('#yard-lawn').check();
    await page.locator('[data-yard-cta]').click();
    await page.locator('#contactName').fill('Draft Visitor');
    await page.locator('#contactPhone').fill('815-555-0100');
    await page.locator('#contactEmail').fill('visitor@example.com');
    await page.locator('#contactAddress').fill('123 Main St, Sycamore, IL');
    await page.locator('#ownerVerify').check();
    await page.locator('#bestTime').selectOption('afternoon');
    await page.locator('#projectDetails').fill('Please use the side gate.');

    await page.locator('a[data-prefill-service="leaf-removal"]').click();

    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}\\?utm_source=local-test&utm_campaign=fall&service=leaf-removal#quote$`));
    await expect(page.locator('#contactName')).toHaveValue('Draft Visitor');
    await expect(page.locator('#contactPhone')).toHaveValue('815-555-0100');
    await expect(page.locator('#contactEmail')).toHaveValue('visitor@example.com');
    await expect(page.locator('#contactAddress')).toHaveValue('123 Main St, Sycamore, IL');
    await expect(page.locator('#ownerVerify')).toBeChecked();
    await expect(page.locator('#bestTime')).toHaveValue('afternoon');
    await expect(page.locator('#projectDetails')).toHaveValue('Please use the side gate.');
    await expect(page.locator('#yardAreasField')).toHaveValue(yardLine);
    await expect(page.locator('#yard-lawn')).toBeChecked();
    await expect(page.locator('#contactService')).toHaveValue('leaf-removal');
    await expect(page.locator('#quotePrefillNotice')).toBeVisible();
    await expect(page.locator('#quoteFormCard')).toBeFocused();
    await expect(page.locator('#quoteFormCard')).toBeInViewport();
  });

  test(`${language}: keyboard quote handoffs announce the form and keep a valid selection`, async ({ page }) => {
    await page.goto(path);
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactService')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('a[data-prefill-service="landscaping"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#quoteFormCard')).toBeFocused();
    await expect(page.locator('#contactService')).toHaveValue('landscaping');
    await expect(page.locator('#quotePrefillStatus')).toContainText(language === 'es' ? 'Paisajismo' : 'Landscaping');
    await expect(page.locator('#contactServiceError')).toBeHidden();
    await expect(page.locator('#contactService')).not.toHaveAttribute('aria-invalid', 'true');

    await page.locator('#yard-tree').check();
    await page.locator('[data-yard-cta]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#quoteFormCard')).toBeFocused();
    await expect(page.locator('#yardSelectionNotice')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('#quoteFormCard a[href]:visible, #quoteFormCard button:visible, #quoteFormCard input:not([type="hidden"]):visible, #quoteFormCard select:visible, #quoteFormCard textarea:visible').first()).toBeFocused();
  });

  test(`${language}: handoff settling stops when the visitor scrolls or types`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const handoff = page.locator('a[data-prefill-service="landscaping"]');
    for (const interaction of ['wheel', 'keyboard']) {
      await handoff.click();
      await expect(page.locator('#quoteFormCard')).toBeFocused();
      await expect(page.locator('#quoteFormCard')).toBeInViewport();
      const initialScroll = await page.evaluate(() => scrollY);
      if (interaction === 'wheel') {
        await page.mouse.wheel(0, 420);
      } else {
        await page.keyboard.press('PageDown');
      }
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initialScroll + 100);
      // A subsequent resize exercises the observer as well as the remaining
      // delayed callbacks. Neither may pull the visitor back to the form top.
      await page.evaluate(() => {
        const spacer = document.createElement('div');
        spacer.style.height = '10px';
        document.body.appendChild(spacer);
      });
      await page.waitForTimeout(450);
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(initialScroll + 100);
    }
  });
}
