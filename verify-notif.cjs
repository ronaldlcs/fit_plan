const playwrightPath = 'C:\\Users\\Ronald Lucas\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmFlNmU4LTJiMzctNGE0ZS05M2I4LWZmNjkwNzI4MjRhZiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwiaWF0IjoxNzgxMTM0NTAxLCJleHAiOjE3ODExMzgxMDF9.AfVet7SXcwXZta2zemPD1g1KGDL_qTmk_fozVljTJbg';
const REFRESH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmFlNmU4LTJiMzctNGE0ZS05M2I4LWZmNjkwNzI4MjRhZiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwiaWF0IjoxNzgxMTM0NTAxLCJleHAiOjE3ODM3MjY1MDF9.cJIPyi-YEndalabi7oLSAGF3xbTdOmGzCEN703Nkrys';
const USER = JSON.stringify({ id: '306ae6e8-2b37-4a4e-93b8-ff69072824af', nome: 'Administrador', email: 'admin@admin.com' });

async function main() {
  const { chromium } = require(playwrightPath);

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();

  // inject localStorage before page loads
  await context.addInitScript(({ token, refresh, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', user);
  }, { token: TOKEN, refresh: REFRESH, user: USER });

  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify-1-initial.png' });
  console.log('Step 1: initial page — screenshot saved (verify-1-initial.png)');

  // Check current URL
  console.log('Current URL:', page.url());

  // Find header buttons
  const allButtons = await page.$$('header button');
  console.log('Buttons in header:', allButtons.length);

  if (allButtons.length === 0) {
    // We may still be on login page
    const url = page.url();
    console.log('Still on login?', url);
    await page.screenshot({ path: 'verify-1b-login.png' });
    await browser.close();
    return;
  }

  // Identify the bell button — it has class "relative"
  let bellButton = null;
  for (let i = 0; i < allButtons.length; i++) {
    const cls = await allButtons[i].getAttribute('class') || '';
    const ariaLabel = await allButtons[i].getAttribute('aria-label') || '';
    console.log(`  button[${i}] class snippet: ${cls.substring(0, 60)} | aria: ${ariaLabel}`);
    if (cls.includes('relative')) {
      bellButton = allButtons[i];
      console.log(`  ^ identified as bell button`);
    }
  }

  if (!bellButton) {
    console.log('Bell button not found by .relative class, trying last before avatar');
    bellButton = allButtons[allButtons.length - 1];
  }

  console.log('\nStep 2: clicking bell button...');
  await bellButton.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verify-2-after-click.png' });
  console.log('Screenshot saved (verify-2-after-click.png)');

  // Check if popover is open
  const popoverContent = await page.$('[data-slot="popover-content"]');
  console.log('Popover [data-slot] found:', !!popoverContent);

  if (popoverContent) {
    const isVisible = await popoverContent.isVisible();
    console.log('Popover visible:', isVisible);
    const box = await popoverContent.boundingBox();
    console.log('Popover bounding box:', box);
    const text = await popoverContent.textContent();
    console.log('Popover text:', text?.trim().substring(0, 120));
  } else {
    // Check for any new element in body
    const bodyChildren = await page.$$('body > *');
    console.log('Body direct children count:', bodyChildren.length);

    // Check for Radix portal
    const portal = await page.$('[data-radix-portal]');
    console.log('Radix portal found:', !!portal);
    if (portal) {
      const text = await portal.textContent();
      console.log('Portal text:', text?.substring(0, 120));
    }
  }

  // Probe: click outside to close
  console.log('\nStep 3: clicking outside to close popover...');
  await page.click('body', { position: { x: 100, y: 100 } });
  await page.waitForTimeout(500);
  const popoverAfterClose = await page.$('[data-slot="popover-content"][data-state="open"]');
  console.log('Popover still open after outside click:', !!popoverAfterClose);

  console.log('\nJS Errors:', errors.length > 0 ? errors : 'none');
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
