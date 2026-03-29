import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const pages = [
  { path: '/', name: '01-welcome' },
  { path: '/scan', name: '03-scan' },
  { path: '/routine', name: '04-routine' },
  { path: '/focus', name: '05-focus' },
  { path: '/health', name: '06-health' },
  { path: '/confidence', name: '07-confidence' },
  { path: '/achievements', name: '08-achievements' },
  { path: '/settings', name: '09-settings' },
  { path: '/shop', name: '10-shop' },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // First, create a session via the API
  const initPage = await ctx.newPage();
  await initPage.goto(BASE);
  await initPage.waitForTimeout(1000);
  await initPage.screenshot({ path: '/home/user/Claude-stuff/screenshots/01-welcome.png' });

  // Click "Get Started" to create session
  const btn = initPage.locator('button:has-text("Get Started")');
  if (await btn.isVisible()) {
    await btn.click();
    await initPage.waitForTimeout(2000);
    await initPage.screenshot({ path: '/home/user/Claude-stuff/screenshots/02-home.png' });
  }

  // Capture remaining pages
  for (const p of pages.slice(1)) {
    const page = await ctx.newPage();
    await page.goto(BASE + p.path);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/home/user/Claude-stuff/screenshots/${p.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log('Screenshots saved to /home/user/Claude-stuff/screenshots/');
}

main().catch(console.error);
