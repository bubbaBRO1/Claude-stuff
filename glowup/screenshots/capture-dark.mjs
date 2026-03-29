import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/Claude-stuff/screenshots';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  // Init session first
  const initPage = await ctx.newPage();
  await initPage.goto(BASE);
  await initPage.waitForTimeout(1000);
  const btn = initPage.locator('button:has-text("Get Started")');
  if (await btn.isVisible()) {
    await btn.click();
    await initPage.waitForTimeout(2000);
  }
  // Set dark theme
  await initPage.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
  });
  await initPage.waitForTimeout(500);
  await initPage.screenshot({ path: `${OUT}/dark-01-home.png`, fullPage: true });
  await initPage.close();

  const pages = [
    { path: '/focus', name: 'dark-02-focus' },
    { path: '/health', name: 'dark-03-health' },
    { path: '/achievements', name: 'dark-04-achievements' },
  ];

  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(BASE + p.path);
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log('Dark mode screenshots saved!');
}

main().catch(console.error);
