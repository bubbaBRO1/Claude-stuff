import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/Claude-stuff/screenshots';

async function capturePages(ctx, theme) {
  const prefix = theme === 'dark' ? 'v2-dark' : 'v2-light';

  const pages = [
    { path: '/', name: `${prefix}-01-home`, fullPage: true },
    { path: '/focus', name: `${prefix}-02-focus` },
    { path: '/coach', name: `${prefix}-03-coach`, fullPage: true },
    { path: '/rank', name: `${prefix}-04-rank`, fullPage: true },
    { path: '/achievements', name: `${prefix}-05-achievements`, fullPage: true },
    { path: '/health', name: `${prefix}-06-health` },
    { path: '/settings', name: `${prefix}-07-settings`, fullPage: true },
    { path: '/routine', name: `${prefix}-08-routine`, fullPage: true },
  ];

  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(BASE + p.path);
    await page.waitForTimeout(1000);
    if (theme === 'dark') {
      await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    } else {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: p.fullPage ?? false });
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  });

  // Create session first
  const initCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const initPage = await initCtx.newPage();
  await initPage.goto(BASE);
  await initPage.waitForTimeout(1000);
  // Welcome screen
  await initPage.screenshot({ path: `${OUT}/v2-dark-00-welcome.png` });
  const btn = initPage.locator('button:has-text("Get Started")');
  if (await btn.isVisible()) {
    await btn.click();
    await initPage.waitForTimeout(2000);
  }
  await initPage.close();

  // Dark mode
  await capturePages(initCtx, 'dark');

  // Light mode
  await capturePages(initCtx, 'light');

  await browser.close();
  console.log('V2 screenshots saved!');
}

main().catch(console.error);
