import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:2026');
  
  // Wait for canvas to be ready
  await page.waitForSelector('canvas');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.waitForFunction(() => !!window.testClickSeat, { timeout: 10000 });
  console.log('--- EXECUTING TEST SCRIPT ---');
  await page.evaluate(() => {
    window.testClickSeat();
  });
  
  await new Promise(r => setTimeout(r, 2500)); // wait for transition
  
  console.log('--- AFTER TRANSITION, EXECUTING BACK ---');
  await page.evaluate(() => {
    if (window.testClickBack) window.testClickBack();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('--- DONE ---');
  
  await page.screenshot({ path: 'test_screenshot.png' });
  await browser.close();
})();
