const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Quick website audit...\n');
  
  // Visit the website
  await page.goto('https://hernandezlandscapeservices.com', { waitUntil: 'networkidle' });
  
  // Desktop view
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'desktop-view.png', fullPage: true });
  console.log('✓ Desktop screenshot saved');
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'mobile-view.png', fullPage: true });
  console.log('✓ Mobile screenshot saved');
  
  // Check for common issues
  const issues = await page.evaluate(() => {
    const problems = [];
    
    // Check for overlapping elements
    const allElements = document.querySelectorAll('*');
    const overlaps = [];
    
    // Check images
    const images = Array.from(document.querySelectorAll('img'));
    const brokenImages = images.filter(img => !img.complete || img.naturalHeight === 0);
    if (brokenImages.length > 0) {
      problems.push(`${brokenImages.length} broken images found`);
    }
    
    // Check viewport overflow
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
      problems.push('Horizontal scroll detected on mobile');
    }
    
    // Check text visibility
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, p, span'));
    const invisibleText = elements.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.height > 0 && style.color === style.backgroundColor;
    });
    if (invisibleText.length > 0) {
      problems.push(`${invisibleText.length} elements with invisible text`);
    }
    
    // Check z-index issues
    const highZIndex = Array.from(document.querySelectorAll('*')).filter(el => {
      const zIndex = window.getComputedStyle(el).zIndex;
      return zIndex !== 'auto' && parseInt(zIndex) > 1000;
    });
    if (highZIndex.length > 0) {
      problems.push(`${highZIndex.length} elements with very high z-index`);
    }
    
    return problems;
  });
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✓ No major issues detected');
  }
  
  // Check specific sections
  const sections = await page.evaluate(() => {
    const sectionInfo = {};
    const sectionIds = ['services', 'gallery', 'testimonials', 'calculator', 'contact'];
    
    sectionIds.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        const rect = section.getBoundingClientRect();
        sectionInfo[id] = {
          visible: rect.height > 0,
          height: rect.height,
          hasContent: section.textContent.trim().length > 0
        };
      }
    });
    
    return sectionInfo;
  });
  
  console.log('\nSection visibility:');
  Object.entries(sections).forEach(([id, info]) => {
    console.log(`  ${id}: ${info.visible ? '✓' : '✗'} (height: ${info.height}px)`);
  });
  
  await browser.close();
})();