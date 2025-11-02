import { expect, test as base } from '@playwright/test';

/**
 * Re-export Playwright's base test/expect so existing specs can
 * import from a shared location. Firebase-specific fixtures and
 * emulator hooks have been removed now that the site runs fully static.
 */
export const test = base;
export { expect };
