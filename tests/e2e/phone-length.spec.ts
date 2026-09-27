import { expect, test } from './fixtures';

// Round 4 · Phone length and legibility (research 03 R13/R17/R20/R22, 05 X11).

test.describe('The year in the yard on phones', () => {
  test('below 640px the ring is a month stepper plus the season panel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?month=8', { waitUntil: 'domcontentloaded' });
    const ring = page.locator('[data-season-ring]');
    await expect(ring.locator('.season-months')).toBeHidden();
    const center = ring.locator('.season-ring-center');
    await expect(center).toHaveAttribute('role', 'status');
    await expect(center.locator('[data-ring-month]')).toHaveText('September');
    await ring.locator('[data-season-step="1"]').click();
    await ring.locator('[data-season-step="1"]').click();
    await ring.locator('[data-season-step="1"]').click();
    await expect(center.locator('[data-ring-month]')).toHaveText('December');
    await expect(page.locator('[data-season-panel="winter"]')).toBeVisible();
    const box = await ring.locator('[data-season-step="-1"]').boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    const height = await page.locator('#year-in-the-yard').evaluate((el) => el.getBoundingClientRect().height);
    expect(height, 'was 1,133px in round 3').toBeLessThanOrEqual(820);
  });

  test('desktop keeps the full ring radiogroup', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?month=8', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-season-ring] .season-months')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'September' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.season-ring-center')).toHaveAttribute('aria-hidden', 'true');
  });
});

test('walk your yard on phones: the checklist leads, plan labels are 12px or more', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const listTop = await page.locator('.yard-list').evaluate((el) => el.getBoundingClientRect().top);
  const planTop = await page.locator('.yard-plan').evaluate((el) => el.getBoundingClientRect().top);
  expect(listTop).toBeLessThan(planTop);
  const sizes = await page.locator('.yard-plan text').evaluateAll((texts) => texts
    .filter((t) => getComputedStyle(t).display !== 'none')
    .map((t) => {
      const svg = t.ownerSVGElement!;
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      return parseFloat(getComputedStyle(t).fontSize) * scale;
    }));
  expect(sizes.length).toBeGreaterThanOrEqual(3);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12);
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) {
  test(`stencil caps labels are 14px or more at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'load' });
    const small = await page.evaluate(() => Array.from(document.querySelectorAll('body *'))
      .filter((el) => !(el instanceof SVGElement))
      .filter((el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim()))
      .filter((el) => {
        const cs = getComputedStyle(el);
        return /Stencil/.test(cs.fontFamily) && cs.display !== 'none' && (el as HTMLElement).offsetParent !== null
          && parseFloat(cs.fontSize) < 14;
      })
      .map((el) => `${el.tagName}.${(el as HTMLElement).className} ${getComputedStyle(el).fontSize}`));
    expect(small).toEqual([]);
  });
}

test('"Every ring, a season" tag passes contrast (white on clay-deep)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-ring-tag')).toHaveCSS('background-color', 'rgb(154, 74, 36)');
});

test('the tape measure is desktop-only and sits on the top edge, away from the season stripe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('header')!, '::before').content)).toBe('none');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const supported = await page.evaluate(() => CSS.supports('animation-timeline: scroll()'));
  test.skip(!supported, 'Scroll-driven animations unsupported in this engine.');
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('header')!, '::before').top)).toBe('0px');
});

test('one focus token: 3px canopy ring with a white halo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const seen = new Set<string>();
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(350); // let hover/transition classes settle
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, shadow: cs.boxShadow };
    });
    if (!style) continue;
    seen.add(style.tag);
    expect(style.outline, style.tag).toBe('solid 3px rgb(12, 42, 32)');
    expect(style.shadow, style.tag).toContain('rgb(255, 255, 255)');
  }
  expect(seen.size).toBeGreaterThan(0);
});
