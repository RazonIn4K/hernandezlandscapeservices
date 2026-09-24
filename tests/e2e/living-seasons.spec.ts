import { expect, test } from './fixtures';

// Round 2 · "Living Seasons + Roots": hero weather, roots footer, "When we do this",
// yard stamps and the field-notebook gallery. ?month=0-11 is the season QA hook.

const luminance = (rgb: string) => {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test.describe('Hero weather follows the season hook', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  for (const [month, selector, count] of [
    ['9', '.wx-leaf', 10],
    ['0', '.wx-flake', 12],
    ['4', '.wx-petal', 10],
    ['7', '.wx-fly', 10],
  ] as const) {
    test(`?month=${month} draws ${count} decorative ${selector} particles`, async ({ page }) => {
      await page.goto(`/?month=${month}`, { waitUntil: 'domcontentloaded' });
      const sky = page.locator('#home .wx-sky');
      await expect(sky).toHaveAttribute('aria-hidden', 'true');
      await expect(sky.locator(selector)).toHaveCount(count);
      expect(await page.locator('#home .wx-sky [tabindex], #home .wx-sky a, #home .wx-sky button').count()).toBe(0);
      expect(await sky.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    });
  }

  test('winter adds a still snow drift and spring grows grass along the hero edge', async ({ page }) => {
    await page.goto('/?month=0', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home .wx-ground.wx-drift')).toHaveCount(1);
    await page.goto('/?month=4', { waitUntil: 'domcontentloaded' });
    // Round 4: the HTML wrapper grows once; nothing inside the SVG animates.
    await expect(page.locator('#home .wx-ground.wx-grass')).toHaveCount(1);
    await expect(page.locator('#home .wx-ground .wx-grow')).toHaveCount(0);
    await page.goto('/?month=7', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home .wx-ground')).toHaveCount(0);
  });

  test('weather pauses once the hero scrolls away', async ({ page }) => {
    await page.goto('/?month=9', { waitUntil: 'domcontentloaded' });
    const sky = page.locator('#home .wx-sky');
    await expect(sky).not.toHaveClass(/wx-paused/);
    await page.locator('#why-choose-us').scrollIntoViewIfNeeded();
    await expect(sky).toHaveClass(/wx-paused/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(sky).not.toHaveClass(/wx-paused/);
  });

  test('weather plays once for 5 s or less, only on HTML wrappers', async ({ page }) => {
    // Round 4 (WCAG 2.2.2): no loop, every particle lands by 5 s, no animation on SVG children.
    for (const month of ['9', '0', '4', '7']) {
      await page.goto(`/?month=${month}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#home .wx-sky .wx-p').first()).toBeAttached();
      const timing = await page.evaluate(() => {
        const own = document.getAnimations().filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
          return !!target && !!target.closest('.wx-sky, .wx-ground');
        });
        return {
          count: own.length,
          infinite: document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity).length,
          svgChildren: own.filter((a) => ((a.effect as KeyframeEffect).target as Element).closest('svg')).length,
          latestEnd: Math.max(0, ...own.map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0))),
        };
      });
      expect(timing.count, `month ${month}: particles animate`).toBeGreaterThan(0);
      expect(timing.infinite, `month ${month}: no infinite animation`).toBe(0);
      expect(timing.svgChildren, `month ${month}: SVG children stay still`).toBe(0);
      expect(timing.latestEnd, `month ${month}: settled by 5 s`).toBeLessThanOrEqual(5000);
    }
  });

  test('phones get six particles, kept to the right-hand strip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?month=9', { waitUntil: 'domcontentloaded' });
    const shown = page.locator('#home .wx-sky .wx-p:visible');
    await expect(shown).toHaveCount(6);
    const lefts = await shown.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    for (const left of lefts) expect(left).toBeGreaterThanOrEqual(390 * 0.5);
  });

  test('reduced motion draws the settled scene with no movement', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?month=0', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home .wx-ground.wx-drift')).toHaveCount(1);
    await expect(page.locator('#home .wx-sky .wx-flake')).toHaveCount(12);
    const moving = await page.evaluate(() => document.getAnimations().filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!target && !!target.closest('.wx-sky, .wx-ground');
    }).length);
    expect(moving).toBe(0);
  });
});

test.describe('"When we do this" on service pages', () => {
  test('in-season month shows the in-season chip and marks today', async ({ page }) => {
    await page.goto('/tree-removal/?month=9', { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-when]');
    await expect(card).toHaveAttribute('data-when-months', '0,1,8,9,10,11');
    const chip = card.locator('[data-when-chip]');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText('In season now', { useInnerText: true });
    await expect(card.locator('.when-seg.is-now')).toHaveCount(1);
    await expect(card.locator('.when-months li.is-now')).toHaveText('Oct');
    await expect(card.locator('.when-ring')).toHaveAttribute('aria-hidden', 'true');
  });

  test('off-season month names the next in-season month, in English and Spanish', async ({ page }) => {
    await page.goto('/tree-removal/?month=4', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-when-chip]')).toHaveText('Next in season: September', { useInnerText: true });
    await page.goto('/es/tree-removal/?month=4', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-when-chip]')).toHaveText('Próxima temporada: septiembre', { useInnerText: true });
    await expect(page.locator('[data-when] h2')).toHaveText('Cuándo lo hacemos');
    await page.goto('/pressure-washing/?month=9', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-when-chip]')).toHaveText('Next in season: June', { useInnerText: true });
  });

  test('emergency pages carry no season ring', async ({ page }) => {
    for (const route of ['/emergency-tree-removal/', '/es/emergency-tree-removal/']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-when]')).toHaveCount(0);
    }
  });
});

test.describe('Roots footer', () => {
  for (const route of ['/', '/tree-removal/', '/gallery/', '/service-areas/dekalb-il/', '/es/']) {
    test(`${route}: decorative soil and readable footer text`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const soil = page.locator('footer .soil');
      await expect(soil).toHaveCount(1);
      await expect(soil).toHaveAttribute('aria-hidden', 'true');
      const ratios = await page.locator('footer p, footer a, footer li, footer span').evaluateAll((elements) =>
        elements
          .filter((element) => element.textContent?.trim() && getComputedStyle(element).visibility !== 'hidden')
          .map((element) => getComputedStyle(element).color),
      );
      const soilLum = luminance('rgb(36, 24, 16)');
      for (const color of ratios) {
        const fg = luminance(color);
        const ratio = (Math.max(fg, soilLum) + 0.05) / (Math.min(fg, soilLum) + 0.05);
        expect(ratio, `${route}: footer text ${color}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

test('roots never pass behind footer text or controls', async ({ page }) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/tree-removal/', '/gallery/', '/service-areas/dekalb-il/']) {
      await page.goto(route, { waitUntil: 'load' });
      const layout = await page.evaluate(() => {
        const roots = [...document.querySelectorAll('footer .soil .rt')].map((path) => path.getBoundingClientRect());
        const content = [...document.querySelectorAll('footer > .container *')]
          .filter((el) => el.matches('a, button, img, input, h1, h2, h3, h4, p, li, span') && el.getBoundingClientRect().height > 0)
          .map((el) => el.getBoundingClientRect());
        return {
          roots: roots.length,
          rootsBottom: Math.max(...roots.map((r) => r.bottom)),
          contentTop: Math.min(...content.map((r) => r.top)),
        };
      });
      expect(layout.roots, `${route} @${width}: roots present`).toBeGreaterThan(10);
      // 3px covers the widest root stroke (5.2 units / 2) beyond the geometry box.
      expect(layout.rootsBottom + 3, `${route} @${width}: roots clear of footer content`).toBeLessThanOrEqual(layout.contentTop);
    }
  }
});

test('yard picker areas reach the quote form notice and follow the language', async ({ page }) => {
  // Round 2 stamped the areas into the form; #51's selection notice now does that job.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const notice = page.locator('#contactForm #yardSelectionNotice');
  await expect(notice).toBeHidden();
  await page.locator('label[for="yard-tree"]').click();
  await page.locator('label[for="yard-gutters"]').click();
  await page.locator('[data-yard-cta]').click();
  await expect(notice).toBeVisible();
  await expect(page.locator('#yardSelectionText')).toHaveText('The big tree, Gutters');
  await expect(page.locator('#contactService')).toHaveValue('multiple-services');
  await page.locator('[data-lang-switch="es"]:visible').first().click();
  await expect(notice.locator('[data-i18n-key="quote.yardSummary"]')).toHaveText('Áreas del jardín agregadas a esta solicitud');
  await expect(page.locator('#yardSelectionText')).toHaveText('El árbol grande, Canaletas');
});

test('gallery prints keep their captions visible', async ({ page }) => {
  await page.goto('/gallery/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.field-notebook .notebook-label')).toBeVisible();
  const captions = page.locator('.field-notebook .gallery-item h3');
  expect(await captions.count()).toBeGreaterThan(10);
  await expect(captions.first()).toBeVisible();
  expect(await captions.first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});
