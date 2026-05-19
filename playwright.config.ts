import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000', // Changed from Firebase emulator
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Static web server for testing
  webServer: {
    command: 'node node_modules/tailwindcss/lib/cli.js -i ./src/input.css -o ./assets/css/styles.css --minify && node node_modules/serve/build/main.js . -l 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
