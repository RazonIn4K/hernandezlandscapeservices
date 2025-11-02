import { expect, test } from './fixtures';

test.describe('Static Gallery Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('/');
  });

  test('loads gallery with actual images', async ({ page }) => {
    // Wait for gallery to load
    await page.waitForSelector('#gallery-container');
    
    // Check that gallery container exists
    const galleryContainer = page.locator('#gallery-container');
    await expect(galleryContainer).toBeVisible();
    
    // Wait for images to load
    await page.waitForSelector('img[src*="hernandez_images"]');
    
    // Check that images are present
    const images = page.locator('#gallery-container img');
    await expect(images).toHaveCount(8); // Should match staticImages array

    // Verify first image points at the static image directory
    const firstImage = images.first();
    await expect(firstImage).toHaveAttribute('src', /hernandez_images\//);
  });

  test('displays latest uploads carousel', async ({ page }) => {
    // Wait for carousel to load
    await page.waitForSelector('#latest-uploads-carousel');
    
    const carousel = page.locator('#latest-uploads-carousel');
    await expect(carousel).toBeVisible();
    
    // Check carousel has images
    const carouselImages = carousel.locator('img');
    await expect(carouselImages.first()).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    // Test main navigation links
    const navLinks = [
      '#services',
      '#gallery', 
      '#pricing',
      '#testimonials',
      '#service-area',
      '#quote'
    ];
    
    for (const link of navLinks) {
      await page.click(`a[href="${link}"]`);
      await expect(page.locator(link)).toBeInViewport();
    }
  });

  test('pricing section displays correctly', async ({ page }) => {
    await page.goto('/#pricing');
    
    // Check pricing cards are present
    const pricingCards = page.locator('[data-testid="pricing-card"]');
    await expect(pricingCards).toHaveCount(3);
    
    // Check "Most Popular" badge
    const popularBadge = page.locator('text=Most Popular');
    await expect(popularBadge).toBeVisible();
    
    // Check pricing values
    await expect(page.locator('text=$16')).toBeVisible();
    await expect(page.locator('text=$29')).toBeVisible();
    await expect(page.locator('text=$46')).toBeVisible();
  });

  test('contact form is accessible', async ({ page }) => {
    await page.goto('/#quote');
    
    // Check form fields exist
    await expect(page.locator('#contactName')).toBeVisible();
    await expect(page.locator('#contactPhone')).toBeVisible();
    await expect(page.locator('#contactEmail')).toBeVisible();
    await expect(page.locator('#projectDetails')).toBeVisible();
    await expect(page.locator('#contactService')).toBeVisible();
    
    // Check submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText(/Send Quote Request/);
  });

  test('mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu works
    const mobileMenuButton = page.locator('button[aria-label="Toggle mobile menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    await mobileMenuButton.click();
    await expect(page.locator('#mobileMenu')).toBeVisible();
    
    // Check navigation links in mobile menu
    const mobileNavLinks = page.locator('#mobileMenu a');
    await expect(mobileNavLinks).not.toHaveCount(0); // Any links rendered
  });

  test('language toggle functionality', async ({ page }) => {
    // Check language toggle buttons exist
    const enButton = page.locator('#langToggleEnDesktop');
    const esButton = page.locator('#langToggleEsDesktop');
    
    await expect(enButton).toBeVisible();
    await expect(esButton).toBeVisible();
    
    // Test switching to Spanish
    await esButton.click();
    await expect(esButton).toHaveClass(/bg-green-600/);
    
    // Test switching back to English
    await enButton.click();
    await expect(enButton).toHaveClass(/bg-green-600/);
  });
});
