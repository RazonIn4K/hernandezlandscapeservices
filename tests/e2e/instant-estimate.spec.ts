import { expect, test } from './fixtures';

// Automation fills forms faster than a human; the anti-bot timing check
// hard-blocks submits under 1.5s, so legit-lead tests backdate the timer.
const backdateFormTimer = async (page: import('@playwright/test').Page) => {
  await page.locator('#formLoadedAt').evaluate((input) => {
    (input as HTMLInputElement).value = String(Date.now() - 60_000);
  });
};

const fillQuoteForm = async (
  page: import('@playwright/test').Page,
  { email, message }: { email: string; message: string },
) => {
  await page.goto('/#quote', { waitUntil: 'domcontentloaded' });
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
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.fill('#propertyAddress', '1234 Main St, DeKalb');
  await page.locator('#isOwner').evaluate((checkbox) => {
    const input = checkbox as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.selectOption('#serviceType', 'tree-service');
  await page.selectOption('#propertySize', 'medium');
  await page.fill('#zipCode', '60115');
  await page.selectOption('#instantBestTime', 'evening');
  await page.click('#calculateQuoteBtn');
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
    await backdateFormTimer(page);
    await page.click('#contactForm button[type="submit"]');

    await expect(page.locator('#customModal')).toBeVisible();
    await expect(page.locator('#modalMessage')).toContainText('Thank you for your interest');

    expect(submittedBody).not.toBeNull();
    expect(submittedBody).not.toContain('[Possible Spam]');
    expect(submittedBody).toContain('1234 Main St, DeKalb');
    expect(submittedBody).toContain('tree-service');
    expect(submittedBody).toContain('evening');
    expect(submittedBody).toContain('$280 - $420');
    expect(submittedBody).toContain('owner_verified');
    expect(submittedBody).toContain('name="ccemail"');
    expect(submittedBody).toContain('tiogilh@gmail.com');
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

  test('starter and final quote form use the same service options', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const starterValues = await page.locator('#serviceType option').evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
    );
    const finalValues = await page.locator('#contactService option').evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
    );

    expect(starterValues).toEqual(finalValues);
  });

  test('stacked-signal campaign spam is hard-blocked and never sent (quota guard)', async ({ page }) => {
    const captured = await mockWeb3Forms(page);

    // getdandy sender + multiple URLs + several spam phrases stacks the content
    // score to >= 4: high enough confidence to hard-block (fake success, zero
    // Web3Forms calls) so a campaign cannot drain the submission quota.
    // Borderline scores (2-3) are still delivered tagged — see the next test.
    await fillQuoteForm(page, {
      email: 'ob-jennifer@getdandynow.com',
      message:
        'I made an AI agent for Hernandez Landscape and can add it to your Google Business Profile. Grab a time here: https://getdandy.com/schedule-a-chat/ Unsubscribe: https://bit.ly/42wnUsa',
    });
    await backdateFormTimer(page);
    await page.click('#contactForm button[type="submit"]');

    await expect(page.locator('#customModal')).toBeVisible();
    await expect(page.locator('#modalMessage')).toContainText('Thank you for your interest');
    expect(captured.bodies).toHaveLength(0);
  });

  test('two links plus one spam phrase reaches Web3Forms tagged', async ({ page }) => {
    const captured = await mockWeb3Forms(page);

    await fillQuoteForm(page, {
      email: 'sales@example.com',
      message:
        'Our ai agent can answer calls for you. See https://example.com/demo and https://example.com/pricing for details.',
    });
    await backdateFormTimer(page);
    await page.click('#contactForm button[type="submit"]');

    await expect(page.locator('#customModal')).toBeVisible();
    expect(captured.bodies).toHaveLength(1);
    expect(captured.bodies[0]).toContain('[Possible Spam]');
  });

  test('honeypot-filled submission is blocked and never sent', async ({ page }) => {
    const captured = await mockWeb3Forms(page);

    await fillQuoteForm(page, {
      email: 'homeowner@example.com',
      message: 'Please give me a quote for weekly lawn mowing.',
    });
    await page.locator('#websiteField').evaluate((input) => {
      (input as HTMLInputElement).value = 'https://spam-bot.example.com';
    });
    await backdateFormTimer(page);
    await page.click('#contactForm button[type="submit"]');

    await expect(page.locator('#customModal')).toBeVisible();
    await expect(page.locator('#modalMessage')).toContainText('Thank you for your interest');
    expect(captured.bodies).toHaveLength(0);
  });

  test('inhumanly fast submission is blocked and never sent', async ({ page }) => {
    const captured = await mockWeb3Forms(page);

    await fillQuoteForm(page, {
      email: 'homeowner@example.com',
      message: 'Please give me a quote for weekly lawn mowing.',
    });
    // Set the timer and submit in the SAME browser task: page.click()'s
    // actionability wait can eat >1500ms on slow CI runners (deferred scripts
    // shifting layout), which turns an "inhumanly fast" submit into a slow one
    // and defeats the point of the test.
    await page.locator('#contactForm').evaluate((form) => {
      const input = form.querySelector('#formLoadedAt') as HTMLInputElement;
      input.value = String(Date.now());
      (form as HTMLFormElement).requestSubmit();
    });

    await expect(page.locator('#customModal')).toBeVisible();
    expect(captured.bodies).toHaveLength(0);
  });
});
