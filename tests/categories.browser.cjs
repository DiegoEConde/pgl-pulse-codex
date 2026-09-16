const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require(process.env.PGL_PGLITE_PATH || process.env.TEMP + '/pandasoft-validation/node_modules/@electric-sql/pglite');
const { chromium } = require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP + '/pandasoft-validation/node_modules/playwright');

(async () => {
 const db = new PGlite();
 let browser;
 try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;");
  for (const file of fs.readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort()) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
  await db.exec("SET ROLE anon; INSERT INTO proveedor(nombre) VALUES('Proveedor de prueba');");
  const categories = (await db.query('SELECT * FROM categorias ORDER BY id')).rows;
  for (const category of categories) await db.query('SELECT pgl_create_product($1,$2,$3)', [category.id, 'Producto ' + category.nombre, '']);
  const snapshot = async () => (await db.query('SELECT pgl_snapshot() AS data')).rows[0].data;
  let missingMigration = false;
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Execute only these RPCs against in-memory PostgreSQL. Never forward REST.
  await page.route('**/rest/v1/**', async route => {
   const name = route.request().url().split('/').at(-1);
   const args = route.request().postDataJSON();
   try {
    let result;
    if (name === 'pgl_snapshot') {
     result = await snapshot();
     if (missingMigration) { delete result.categories; delete result.categoryCharacteristics; }
    } else if (name === 'pgl_create_order') {
     result = (await db.query('SELECT pgl_create_order($1,$2::date,$3::date,$4,$5,$6::jsonb,$7::uuid) AS data', [args.p_supplier, args.p_date, args.p_expected, args.p_shipping, args.p_notes, JSON.stringify(args.p_lines), args.p_request])).rows[0].data;
    } else if (name === 'pgl_create_product') {
     result = (await db.query('SELECT pgl_create_product($1,$2,$3) AS data', [args.p_category, args.p_name, args.p_brand])).rows[0].data;
    } else if (name === 'pgl_add_category_value') {
     result = (await db.query('SELECT pgl_add_category_value($1,$2) AS data', [args.p_characteristic, args.p_value])).rows[0].data;
    } else throw Error('Unexpected REST request: ' + name);
    await route.fulfill({ json: result });
   } catch (error) { await route.fulfill({ status: 400, json: { code: error.code || 'P0001', message: error.message } }); }
  });
  const nav = async name => {
   await page.locator('.topbar').waitFor();
   await page.waitForFunction(() => document.querySelector('[aria-label="Actualizar datos"]')?.disabled === false);
   const menu = page.getByRole('button', { name: /Abrir men/ });
   if (page.viewportSize().width < 680) { await menu.waitFor(); await menu.click(); await page.getByRole('navigation').waitFor({ state: 'visible' }); }
   await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  };
  await page.goto(process.env.PGL_TEST_URL || 'http://localhost:3100', { waitUntil: 'networkidle' });
  await nav('Compras');
  for (const category of categories) {
   const data = await snapshot();
   const product = data.products.find(product => product.categoria_id === category.id);
   await page.getByRole('button', { name: 'Nueva compra', exact: true }).click();
   await page.locator('#supplier').selectOption('1');
   await page.locator('select[id^="product-"]').selectOption(String(product.id));
   await page.locator('input[id^="cost-"]').fill('25');
   const fields = data.categoryCharacteristics.filter(field => field.categoria_id === category.id);
   assert.equal(await page.locator('select[id^="option-"], input[id^="option-"], select[id^="color-"]').count(), fields.length);
   for (const field of fields) {
    const control = page.locator(`[id^="${field.clave === 'color' ? 'color-' : 'option-' + field.clave + '-'}"]`);
    if (field.tipo === 'entero') {
     await control.fill('351');
     assert.equal(await control.evaluate(element => element.validity.valid), false);
     await control.fill('2.5');
     assert.equal(await control.evaluate(element => element.validity.valid), false);
     await control.fill('350');
    } else await control.selectOption(field.valores[0]);
   }
   await page.getByRole('button', { name: 'Cargar en Reparto', exact: true }).click();
   await page.getByRole('dialog').waitFor({ state: 'hidden' });
  }
  assert.equal((await snapshot()).orders.length, 15);
  await page.getByRole('button', { name: 'Nueva compra', exact: true }).click();
  await page.locator('#supplier').selectOption('1');
  await page.locator('input[id^="cost-"]').fill('321');
  await page.locator('#notes').fill('Conservar este borrador');
  await page.getByRole('button', { name: 'Crear producto para línea 1' }).click();
  await page.locator('#new-category').selectOption(String(categories.find(category => category.nombre === 'celulares').id));
  await page.locator('#new-name').fill('Nuevo telefono');
  await page.getByRole('button', { name: 'Crear producto', exact: true }).click();
  await page.getByRole('dialog', { name: 'Nuevo producto', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#notes').inputValue(), 'Conservar este borrador');
  assert.equal(await page.locator('input[id^="cost-"]').inputValue(), '321');
  await page.getByRole('button', { name: 'Agregar valor de RAM', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nuevo valor de RAM', exact: true }).fill('48gb');
  await page.getByRole('button', { name: 'Guardar valor', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nuevo valor de RAM', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await page.locator('select[id^="option-ram-"]').inputValue(), '48 GB');
  await page.locator('select[id^="option-rom-"]').selectOption('1 TB');
  await page.locator('select[id^="color-"]').selectOption('Azul');
  fs.mkdirSync('tests/artifacts', { recursive: true });
  for (const [width, height] of [[1440,1000],[390,844]]) {
   await page.setViewportSize({ width, height });
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
   assert.equal(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
   await page.screenshot({ path: `tests/artifacts/categories-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Cargar en Reparto', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const data = await snapshot();
  const latest = data.orders[0];
  assert.deepEqual(data.lines.find(line => line.pedido_id === latest.id).atributos, { ram: '48 GB', rom: '1 TB' });
  await page.reload({ waitUntil: 'networkidle' });
  await nav('Compras');
  await page.getByRole('button', { name: 'Ver pedido ' + latest.id, exact: true }).click();
  await page.getByText('48 GB / 1 TB', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  missingMigration = true;
  await page.getByRole('button', { name: 'Actualizar datos', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva compra', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Cargar en Reparto', exact: true }).isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log('PASS: 15 categories, required fields, numeric limits, new product/value, preserved draft, reload, desktop/mobile, missing migration. PostgreSQL in memory only.');
 } finally { if (browser) await browser.close(); await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
