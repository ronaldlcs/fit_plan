import { chromium } from 'C:/Users/Ronald Lucas/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:3000');
await page.waitForTimeout(2000);

// If there's a login page
const loginForm = await page.$('input[type="email"], input[name="email"]');
if (loginForm) {
  console.log('LOGIN PAGE detected');
  await page.fill('input[type="email"], input[name="email"]', 'test@test.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

await page.screenshot({ path: 'verify-1-initial.png' });
console.log('Step 1: initial screenshot saved');

const allButtons = await page.$$('header button');
console.log('Buttons in header:', allButtons.length);

const bellButton = await page.$('header button.relative');
console.log('Bell relative button found:', !!bellButton);

if (bellButton) {
  await bellButton.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verify-2-after-click.png' });
  console.log('Step 2: clicked bell, screenshot saved');

  const popoverContent = await page.$('[data-slot="popover-content"]');
  console.log('Popover content element found:', !!popoverContent);
  if (popoverContent) {
    const isVisible = await popoverContent.isVisible();
    console.log('Popover visible:', isVisible);
    const text = await popoverContent.textContent();
    console.log('Popover text preview:', text?.substring(0, 80));
  }
} else {
  console.log('Bell button not found by .relative class');
  for (let i = 0; i < allButtons.length; i++) {
    const cls = await allButtons[i].getAttribute('class');
    console.log(`  button[${i}] class: ${cls}`);
  }
  await page.screenshot({ path: 'verify-2-no-bell.png' });
}

console.log('JS Errors:', errors.length > 0 ? errors : 'none');
await browser.close();
