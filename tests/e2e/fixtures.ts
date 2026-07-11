import { expect, test as base } from '@playwright/test';

/**
 * Re-export Playwright's base test/expect so existing specs can
 * import from a shared location. Firebase-specific fixtures and
 * emulator hooks have been removed now that the site runs fully static.
 */
export const test = base.extend<{ blockExternalAnalytics: void }>({
  blockExternalAnalytics: [
    async ({ page }, use) => {
      await page.route(
        /https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\//,
        (route) => route.abort(),
      );
      await use();
    },
    { auto: true },
  ],
});
export { expect };
