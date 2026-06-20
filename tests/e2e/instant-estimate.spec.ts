import { expect, test } from './fixtures';

const fillInstantEstimator = async (page: import('@playwright/test').Page) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.fill('#propertyAddress', '1234 Main St, DeKalb');
  await page.locator('#isOwner').setChecked(true, { force: true });
  await page.selectOption('#serviceType', 'tree');
  await page.selectOption('#propertySize', 'medium');
  await page.fill('#zipCode', '60115');
  await page.selectOption('#instantBestTime', 'evening');
  await page.click('button[onclick="calculateQuote()"]');
  await expect(page.locator('#quoteResult')).toBeVisible();
  await expect(page.locator('#priceRange')).toHaveText('$280 - $420');
};

test.describe('Instant estimate lead handoff', () => {
  test('send button prefills the contact form with estimator data', async ({ page }) => {
    await fillInstantEstimator(page);
    await page.click('#sendEstimateBtn');

    await expect(page.locator('#quote')).toBeInViewport();
    await expect(page.locator('#contactAddress')).toHaveValue('1234 Main St, DeKalb');
    await expect(page.locator('#ownerVerify')).toBeChecked();
    await expect(page.locator('#bestTime')).toHaveValue('evening');
    await expect(page.locator('#contactService')).toHaveValue('tree-service');
    await expect(page.locator('#quotePrefillNotice')).toBeVisible();

    const details = await page.inputValue('#projectDetails');
    expect(details).toContain('Tree Service');
    expect(details).toContain('ZIP 60115');
    expect(details).toContain('$280 - $420');
  });

  test('estimator data reaches the Web3Forms payload on submit', async ({ page }) => {
    let submittedBody: string | null = null;
    await page.route('**/api.web3forms.com/**', async (route) => {
      submittedBody = route.request().postData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await fillInstantEstimator(page);
    await page.click('#sendEstimateBtn');

    await page.fill('#contactName', 'Test Lead');
    await page.fill('#contactPhone', '815-555-0100');
    await page.click('#contactForm button[type="submit"]');

    await expect(page.locator('#customModal')).toBeVisible();
    await expect(page.locator('#modalMessage')).toContainText('Thank you for your interest');

    expect(submittedBody).not.toBeNull();
    expect(submittedBody).toContain('1234 Main St, DeKalb');
    expect(submittedBody).toContain('tree-service');
    expect(submittedBody).toContain('evening');
    expect(submittedBody).toContain('$280 - $420');
    expect(submittedBody).toContain('owner_verified');
  });

  test('calculating an estimate alone sends no network request', async ({ page }) => {
    const web3formsRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('web3forms')) {
        web3formsRequests.push(request.url());
      }
    });

    await fillInstantEstimator(page);
    expect(web3formsRequests).toHaveLength(0);
  });

  test('duplicate bestTime IDs are gone', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#bestTime')).toHaveCount(1);
    await expect(page.locator('#instantBestTime')).toHaveCount(1);
  });
});
