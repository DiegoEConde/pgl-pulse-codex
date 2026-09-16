const assert = require('node:assert/strict');
const { chromium } = require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP + '/pandasoft-validation/node_modules/playwright');
// Live snapshot only. All other REST requests are blocked before reaching Supabase.
(async () => {
 const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
 try {
  const page = await browser.newPage({ viewport: { width:1440, height:1000 }, reducedMotion:'reduce' });
  const writes = [];
  await page.route('**/rest/v1/**', route => {
   if (new URL(route.request().url()).pathname.endsWith('/rpc/pgl_snapshot')) return route.continue();
   writes.push(route.request().url());
   return route.abort();
  });
  const response = page.waitForResponse(response => response.url().endsWith('/rpc/pgl_snapshot'));
  await page.goto(process.env.PGL_TEST_URL || 'http://localhost:3100', { waitUntil:'networkidle' });
  const raw = await (await response).json();
  assert.equal(raw.categories.length,15);
  assert.equal(raw.categoryCharacteristics.length,22);
  assert.ok(raw.products.every(product => product.categoria_id));
  await page.getByRole('navigation').getByRole('button',{name:'Compras',exact:true}).click();
  await page.getByRole('button',{name:'Nueva compra',exact:true}).click();
  const mobileCategory = raw.categories.find(category => category.nombre === 'celulares');
  const phone = raw.products.find(product => product.categoria_id === mobileCategory.id);
  await page.locator('select[id^="product-"]').selectOption(String(phone.id));
  assert.equal(await page.locator('select[id^="color-"] option').count(),11);
  await page.locator('select[id^="option-ram-"]').selectOption('32 GB');
  await page.locator('select[id^="option-rom-"]').selectOption('2 TB');
  await page.getByRole('button',{name:'Crear producto para línea 1'}).click();
  assert.equal(await page.locator('#new-category option').count(),16);
  assert.deepEqual(writes,[]);
  console.log('PASS: real snapshot, 15 categories, 22 characteristics, linked products and purchase selectors. No browser writes.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
