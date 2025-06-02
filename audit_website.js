const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting website audit...\n');
  
  // Visit the website
  await page.goto('https://hernandezlandscapeservices.com', { waitUntil: 'networkidle' });
  
  // Desktop view audit
  console.log('=== DESKTOP VIEW (1920x1080) ===');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(2000);
  
  // Check hero section
  const heroVisible = await page.isVisible('.hero-bg');
  console.log(`✓ Hero section visible: ${heroVisible}`);
  
  // Check navigation
  const navVisible = await page.isVisible('nav');
  console.log(`✓ Navigation visible: ${navVisible}`);
  
  // Scroll through sections
  const sections = ['services', 'gallery', 'testimonials', 'calculator', 'contact'];
  
  for (const section of sections) {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, section);
    await page.waitForTimeout(1000);
    
    const sectionElement = await page.$(`#${section}`);
    if (sectionElement) {
      const isVisible = await sectionElement.isVisible();
      console.log(`✓ ${section.charAt(0).toUpperCase() + section.slice(1)} section visible: ${isVisible}`);
      
      // Check for any overlapping elements
      const overlaps = await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);
        return topElement && !el.contains(topElement);
      }, section);
      
      if (overlaps) {
        console.log(`⚠️  Warning: ${section} section may have overlapping elements`);
      }
    }
  }
  
  // Check images
  const brokenImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.complete || img.naturalHeight === 0).map(img => img.src);
  });
  
  if (brokenImages.length > 0) {
    console.log(`\n⚠️  Broken images found:`);
    brokenImages.forEach(src => console.log(`  - ${src}`));
  } else {
    console.log(`\n✓ All images loaded successfully`);
  }
  
  // Mobile view audit
  console.log('\n=== MOBILE VIEW (375x812) ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(2000);
  
  // Check mobile menu
  const mobileMenuButton = await page.$('[id*="mobile-menu"], [class*="mobile-menu"], button[aria-label*="menu"]');
  if (mobileMenuButton) {
    console.log('✓ Mobile menu button found');
    await mobileMenuButton.click();
    await page.waitForTimeout(500);
    const mobileNavVisible = await page.isVisible('nav ul, nav .menu');
    console.log(`✓ Mobile navigation opens: ${mobileNavVisible}`);
  } else {
    console.log('⚠️  No mobile menu button found');
  }
  
  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  if (hasHorizontalScroll) {
    console.log('⚠️  Warning: Page has horizontal scroll on mobile');
  } else {
    console.log('✓ No horizontal scroll on mobile');
  }
  
  // Check text readability
  const smallText = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('p, span, div'));
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      return fontSize > 0 && fontSize < 14 && el.textContent.trim().length > 0;
    }).length;
  });
  
  if (smallText > 0) {
    console.log(`⚠️  Warning: ${smallText} elements with text smaller than 14px on mobile`);
  } else {
    console.log('✓ Text sizes are readable on mobile');
  }
  
  // Check buttons and CTAs
  const buttons = await page.$$('button, a[class*="btn"], a[class*="button"]');
  console.log(`\n✓ Found ${buttons.length} buttons/CTAs`);
  
  // Test form functionality
  console.log('\n=== FORM TESTING ===');
  await page.goto('https://hernandezlandscapeservices.com#calculator');
  
  // Try quote calculator
  const serviceSelect = await page.$('#service');
  if (serviceSelect) {
    await serviceSelect.selectOption({ index: 1 });
    const sizeSelect = await page.$('#propertySize');
    await sizeSelect.selectOption({ index: 1 });
    await page.fill('#zipCode', '60115');
    
    const calculateButton = await page.$('button:has-text("Calculate")');
    if (calculateButton) {
      await calculateButton.click();
      await page.waitForTimeout(1000);
      const quoteResult = await page.$('#quoteResult');
      const hasQuote = await quoteResult.isVisible();
      console.log(`✓ Quote calculator works: ${hasQuote}`);
    }
  }
  
  // Take final screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'desktop-audit.png', fullPage: true });
  console.log('\n✓ Desktop screenshot saved as desktop-audit.png');
  
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'mobile-audit.png', fullPage: true });
  console.log('✓ Mobile screenshot saved as mobile-audit.png');
  
  await browser.close();
  console.log('\nAudit complete!');
})();