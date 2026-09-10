import { expect, test } from './fixtures';

// Automation fills forms faster than a human; the timing heuristic tags submits
// under 1.5s, so clean-lead tests backdate the timer when they assert no tag.
const backdateFormTimer = async (page: import('@playwright/test').Page) => {
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60_000);
  });
};

const fillQuoteForm = async (
  page: import('@playwright/test').Page,
  { email, message }: { email: string; message: string },
) => {
  await page.goto('/#quote', { waitUntil: 'load' });
  await page.fill('#contactName', 'Jennifer Obrien');
  await page.fill('#contactPhone', '9499797488');
  await page.fill('#contactEmail', email);
  await page.fill('#contactAddress', '9891 Irvine Center Drive');
  await page.locator('#ownerVerify').evaluate((checkbox) => {
    const input = checkbox as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.selectOption('#bestTime', 'afternoon');
  await page.selectOption('#contactService', 'lawn-care');
  await page.fill('#projectDetails', message);
};

const mockWeb3Forms = async (page: import('@playwright/test').Page) => {
  const captured: { bodies: string[] } = { bodies: [] };
  await page.route('**/api.web3forms.com/**', async (route) => {
    captured.bodies.push(route.request().postData() ?? '');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  return captured;
};

const fillInstantEstimator = async (page: import('@playwright/test').Page) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.fill('#instantName', 'Test Lead');
  await page.fill('#instantPhone', '815-555-0100');
  await page.fill('#propertyAddress', '1234 Main St, DeKalb');
  await page.locator('#isOwner').evaluate((checkbox) => {
    const input = checkbox as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.selectOption('#serviceType', 'tree-service');
  await page.fill('#zipCode', '60115');
  await page.locator('#quoteForm details').evaluate((details) => {
    (details as HTMLDetailsElement).open = true;
  });
  await page.selectOption('#propertySize', 'medium');
  await page.selectOption('#instantBestTime', 'evening');
  await page.click('#calculateQuoteBtn');
  await expect(page.locator('#quoteResult')).toBeVisible();
  await expect(page.locator('#priceRange')).toHaveText('$280 - $420');
};

test.describe('Homepage starting range', () => {
  test('does not show a $0–$0 placeholder to visitors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#priceRange')).not.toHaveText(/^\s*\$0\s*[-–—]\s*\$0\s*$/);
    await expect(page.locator('#priceRange')).toContainText('(815) 501-1478');
  });
});
