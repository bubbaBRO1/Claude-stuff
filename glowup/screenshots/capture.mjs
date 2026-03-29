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
  });

  // Welcome page (no session)
  const initPage = await ctx.newPage();
  await initPage.goto(BASE);
  await initPage.waitForTimeout(1500);
  await initPage.screenshot({ path: `${OUT}/01-welcome.png` });

  // Click "Get Started" to create session
  const btn = initPage.locator('button:has-text("Get Started")');
  if (await btn.isVisible()) {
    await btn.click();
    await initPage.waitForTimeout(2500);
    await initPage.screenshot({ path: `${OUT}/02-home.png`, fullPage: true });
  }
  await initPage.close();

  const pages = [
    { path: '/scan', name: '03-scan' },
    { path: '/routine', name: '04-routine' },
    { path: '/focus', name: '05-focus' },
    { path: '/health', name: '06-health' },
    { path: '/confidence', name: '07-confidence' },
    { path: '/achievements', name: '08-achievements' },
    { path: '/settings', name: '09-settings' },
    { path: '/shop', name: '10-shop' },
  ];

  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(BASE + p.path);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log('Done! Screenshots saved to ' + OUT);
}

main().catch(console.error);
