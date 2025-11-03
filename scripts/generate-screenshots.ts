import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script to generate screenshots of the Hernandez Landscape Services website
 * for use in WhatsApp marketing materials.
 *
 * Generates:
 * - Full page screenshots (EN and ES)
 * - Section-specific screenshots (gallery, pricing, contact)
 * - Mobile view screenshots
 */

async function generateScreenshots() {
  // Create screenshots directory if it doesn't exist
  const screenshotDir = path.join(__dirname, '..', 'sales', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Update this URL to match your local or production URL
  const baseURL = 'http://localhost:3000';

  console.log('🚀 Starting screenshot generation...\n');

  try {
    // Navigate to homepage
    console.log('📸 Loading homepage...');
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Wait for gallery to load
    await page.waitForSelector('.image-gallery', { timeout: 5000 });

    // ===== ENGLISH VERSION =====
    console.log('📸 Capturing English version...');

    // Ensure English is selected
    await page.click('[data-lang-switch="en"]');
    await page.waitForTimeout(1000);

    // Full page screenshot (English)
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-en-full.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-en-full.png');

    // Hero section (English)
    const heroSection = await page.locator('section').first();
    await heroSection.screenshot({
      path: path.join(screenshotDir, 'hero-section-en.png')
    });
    console.log('✅ Saved: hero-section-en.png');

    // Gallery section (English)
    await page.locator('#gallery').screenshot({
      path: path.join(screenshotDir, 'gallery-section-en.png')
    });
    console.log('✅ Saved: gallery-section-en.png');

    // Pricing section (English)
    await page.locator('#pricing').screenshot({
      path: path.join(screenshotDir, 'pricing-section-en.png')
    });
    console.log('✅ Saved: pricing-section-en.png');

    // Contact section (English)
    await page.locator('#contact').screenshot({
      path: path.join(screenshotDir, 'contact-section-en.png')
    });
    console.log('✅ Saved: contact-section-en.png');

    // ===== SPANISH VERSION =====
    console.log('\n📸 Capturing Spanish version...');

    // Switch to Spanish
    await page.click('[data-lang-switch="es"]');
    await page.waitForTimeout(1000);

    // Full page screenshot (Spanish)
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-es-full.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-es-full.png');

    // Hero section (Spanish)
    await heroSection.screenshot({
      path: path.join(screenshotDir, 'hero-section-es.png')
    });
    console.log('✅ Saved: hero-section-es.png');

    // Gallery section (Spanish)
    await page.locator('#gallery').screenshot({
      path: path.join(screenshotDir, 'gallery-section-es.png')
    });
    console.log('✅ Saved: gallery-section-es.png');

    // Pricing section (Spanish)
    await page.locator('#pricing').screenshot({
      path: path.join(screenshotDir, 'pricing-section-es.png')
    });
    console.log('✅ Saved: pricing-section-es.png');

    // Contact section (Spanish)
    await page.locator('#contact').screenshot({
      path: path.join(screenshotDir, 'contact-section-es.png')
    });
    console.log('✅ Saved: contact-section-es.png');

    // ===== MOBILE VIEWS =====
    console.log('\n📱 Capturing mobile views...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile full page (English)
    await page.click('[data-lang-switch="en"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-en-mobile.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-en-mobile.png');

    // Mobile full page (Spanish)
    await page.click('[data-lang-switch="es"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-es-mobile.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-es-mobile.png');

    console.log('\n🎉 Screenshot generation complete!');
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    console.log('\n📊 Files generated:');
    console.log('   - homepage-en-full.png');
    console.log('   - homepage-es-full.png');
    console.log('   - hero-section-en.png');
    console.log('   - hero-section-es.png');
    console.log('   - gallery-section-en.png');
    console.log('   - gallery-section-es.png');
    console.log('   - pricing-section-en.png');
    console.log('   - pricing-section-es.png');
    console.log('   - contact-section-en.png');
    console.log('   - contact-section-es.png');
    console.log('   - homepage-en-mobile.png');
    console.log('   - homepage-es-mobile.png');

  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
generateScreenshots().catch(console.error);