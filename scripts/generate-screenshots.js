const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

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

    // Wait for gallery to load (with error handling if selector doesn't exist)
    try {
      await page.waitForSelector('.image-gallery', { timeout: 5000 });
    } catch (e) {
      console.log('⚠️  Gallery selector not found, continuing anyway...');
    }

    // ===== ENGLISH VERSION =====
    console.log('📸 Capturing English version...');

    // Try to click English language toggle (if it exists)
    try {
      await page.click('[data-lang-switch="en"]');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️  Language toggle not found, continuing with default language...');
    }

    // Full page screenshot (English)
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-en-full.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-en-full.png');

    // Hero section (English) - try first section or body
    try {
      const heroSection = await page.locator('section').first();
      await heroSection.screenshot({
        path: path.join(screenshotDir, 'hero-section-en.png')
      });
      console.log('✅ Saved: hero-section-en.png');
    } catch (e) {
      console.log('⚠️  Could not capture hero section');
    }

    // Gallery section (English)
    try {
      await page.locator('#gallery').screenshot({
        path: path.join(screenshotDir, 'gallery-section-en.png')
      });
      console.log('✅ Saved: gallery-section-en.png');
    } catch (e) {
      console.log('⚠️  Could not capture gallery section');
    }

    // Pricing section (English)
    try {
      await page.locator('#pricing').screenshot({
        path: path.join(screenshotDir, 'pricing-section-en.png')
      });
      console.log('✅ Saved: pricing-section-en.png');
    } catch (e) {
      console.log('⚠️  Could not capture pricing section');
    }

    // Contact section (English)
    try {
      await page.locator('#contact').screenshot({
        path: path.join(screenshotDir, 'contact-section-en.png')
      });
      console.log('✅ Saved: contact-section-en.png');
    } catch (e) {
      console.log('⚠️  Could not capture contact section');
    }

    // ===== SPANISH VERSION =====
    console.log('\n📸 Capturing Spanish version...');

    // Switch to Spanish
    try {
      await page.click('[data-lang-switch="es"]');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️  Spanish toggle not found, skipping Spanish screenshots');
    }

    // Full page screenshot (Spanish)
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-es-full.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-es-full.png');

    // Hero section (Spanish)
    try {
      const heroSection = await page.locator('section').first();
      await heroSection.screenshot({
        path: path.join(screenshotDir, 'hero-section-es.png')
      });
      console.log('✅ Saved: hero-section-es.png');
    } catch (e) {
      console.log('⚠️  Could not capture hero section (ES)');
    }

    // Gallery section (Spanish)
    try {
      await page.locator('#gallery').screenshot({
        path: path.join(screenshotDir, 'gallery-section-es.png')
      });
      console.log('✅ Saved: gallery-section-es.png');
    } catch (e) {
      console.log('⚠️  Could not capture gallery section (ES)');
    }

    // Pricing section (Spanish)
    try {
      await page.locator('#pricing').screenshot({
        path: path.join(screenshotDir, 'pricing-section-es.png')
      });
      console.log('✅ Saved: pricing-section-es.png');
    } catch (e) {
      console.log('⚠️  Could not capture pricing section (ES)');
    }

    // Contact section (Spanish)
    try {
      await page.locator('#contact').screenshot({
        path: path.join(screenshotDir, 'contact-section-es.png')
      });
      console.log('✅ Saved: contact-section-es.png');
    } catch (e) {
      console.log('⚠️  Could not capture contact section (ES)');
    }

    // ===== MOBILE VIEWS =====
    console.log('\n📱 Capturing mobile views...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile full page (English)
    try {
      await page.click('[data-lang-switch="en"]');
      await page.waitForTimeout(500);
    } catch (e) {
      // Continue anyway
    }
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-en-mobile.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-en-mobile.png');

    // Mobile full page (Spanish)
    try {
      await page.click('[data-lang-switch="es"]');
      await page.waitForTimeout(500);
    } catch (e) {
      // Continue anyway
    }
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-es-mobile.png'),
      fullPage: true
    });
    console.log('✅ Saved: homepage-es-mobile.png');

    console.log('\n🎉 Screenshot generation complete!');
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    console.log('\n📊 Generated screenshots:');

    // List all generated files
    const files = fs.readdirSync(screenshotDir);
    files.forEach(file => {
      if (file.endsWith('.png')) {
        const stats = fs.statSync(path.join(screenshotDir, file));
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   - ${file} (${sizeMB} MB)`);
      }
    });

  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
generateScreenshots().catch(console.error);