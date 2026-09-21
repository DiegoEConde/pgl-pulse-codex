const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require(process.env.PGL_PGLITE_PATH || process.env.TEMP + '/pandasoft-validation/node_modules/@electric-sql/pglite');
const { chromium } = require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP + '/pandasoft-validation/node_modules/playwright');
(async () => {
 const db = new PGlite(); let browser;
 try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;");
  for (const file of fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
  await db.exec('SET ROLE anon');
  const snapshot = async () => (await db.query('SELECT pgl_snapshot() AS data')).rows[0].data;
  const data = await snapshot();
  const audio = data.categories.find(c => c.nombre === 'audio');
  const phone = data.categories.find(c => c.nombre === 'celulares');
  const attrs = { potencia: '20' };
  const insert = (category, name, attributes) => db.query('INSERT INTO producto(categoria_id,nombre,marca,atributos) VALUES($1,$2,$3,$4::jsonb) RETURNING *', [category, name, 'Marca', JSON.stringify(attributes)]);
  await insert(audio.id, 'Modelo', attrs);
  await assert.rejects(insert(audio.id, 'Modelo', { ...attrs, color: 'Rojo' }), e => e.code === '23505');
  await assert.rejects(insert(audio.id, ' modelo ', attrs), e => e.code === '23505');
  await insert(audio.id, 'Modelo', { ...attrs, potencia: '30' });
  await insert(phone.id, 'Modelo', {});
  const base1 = await db.query('SELECT pgl_create_product($1,$2,$3) AS id', [audio.id, 'Modelo', 'Marca']);
  const base2 = await db.query('SELECT pgl_create_product($1,$2,$3) AS id', [audio.id, 'Modelo', 'Marca']);
  assert.equal(base1.rows[0].id, base2.rows[0].id);
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; let alerts = 0, writes = 0, rejectWrite = false;
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', async dialog => { if(dialog.type() === 'alert') alerts++; await dialog.accept(); });
  await page.route('**/rest/v1/**', async route => {
   try {
    const url = new URL(route.request().url());
    let result;
    if (url.pathname.endsWith('/pgl_snapshot')) result = await snapshot();
    else if (url.pathname.endsWith('/pgl_add_category_value')) {
     const body = route.request().postDataJSON();
     result = (await db.query('SELECT pgl_add_category_value($1,$2) AS value', [body.p_characteristic,body.p_value])).rows[0].value;
    } else if (url.pathname.endsWith('/producto')) {
     writes++;
     if(rejectWrite) { await route.fulfill({ status:409, json:{ code:'23505',message:'duplicate' } }); return; }
     const body = route.request().postDataJSON();
     if(route.request().method() === 'PATCH') result = (await db.query('UPDATE producto SET nombre=$1,marca=$2,categoria=$3,atributos=$4::jsonb WHERE id=$5 RETURNING *',[body.nombre,body.marca,body.categoria,JSON.stringify(body.atributos),Number(url.searchParams.get('id').slice(3))])).rows[0];
     else result = (await db.query('INSERT INTO producto(nombre,marca,categoria,atributos) VALUES($1,$2,$3,$4::jsonb) RETURNING *',[body.nombre,body.marca,body.categoria,JSON.stringify(body.atributos)])).rows[0];
    } else throw Error('Unexpected request: ' + url.pathname);
    await route.fulfill({ json:result });
   } catch(e) { await route.fulfill({ status:400, json:{code:e.code,message:e.message} }); }
  });
  await page.goto(process.env.PGL_TEST_URL || 'http://localhost:3000', { waitUntil:'networkidle' });
  await page.getByRole('navigation').getByRole('button',{ name:'Datos',exact:true }).click();
  await page.getByRole('button',{name:/Productos.*elementos creados/}).click();
  const open = () => page.getByRole('button',{name:'Nuevo producto',exact:true}).click();
  const dialog = page.getByRole('dialog');
  await open();
  assert.equal(await dialog.locator('input').count(),0);
  const labels = await page.locator('#categoria option').allTextContents();
  assert.deepEqual(labels.slice(1), [...labels.slice(1)].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'})));
  assert.equal(labels.length,data.categories.length+1);
  assert(labels.slice(1).every(s=>s[0]===s[0].toUpperCase()));
  for(const category of data.categories) {
   await page.locator('#categoria').selectOption(category.nombre);
   const fields = data.categoryCharacteristics.filter(f=>f.categoria_id===category.id && f.clave!=='color');
   assert.equal(await dialog.locator('[id^="attribute-"]').count(),fields.length);
  }
  await page.locator('#categoria').selectOption('celulares');
  await page.locator('#nombre').fill('Telefono ampliado');
  const addValue = async (label, draft, key, expected) => {
   await dialog.getByRole('button',{name:'Agregar valor de '+label,exact:true}).click();
   await dialog.getByRole('textbox',{name:'Nuevo valor de '+label,exact:true}).fill(draft);
   await dialog.getByRole('button',{name:'Guardar valor',exact:true}).click();
   await dialog.getByRole('textbox',{name:'Nuevo valor de '+label,exact:true}).waitFor({state:'hidden'});
   assert.equal(await page.locator('#attribute-'+key).inputValue(),expected);
  };
  await addValue('RAM','48gb','ram','48 GB');
  await addValue('Almacenamiento','6tb','rom','6 TB');
  assert.equal(await page.locator('#attribute-color').count(),0);
  assert.equal(await page.locator('#nombre').inputValue(),'Telefono ampliado');
  await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  const expanded=(await snapshot()).products.find(p=>p.nombre==='Telefono ampliado');
  assert.deepEqual(expanded.atributos,{ram:'48 GB',rom:'6 TB'});
  await page.getByRole('row').filter({has:page.getByRole('cell',{name:String(expanded.id),exact:true})}).getByRole('button',{name:'Modificar'}).click();
  assert.equal(await page.locator('#attribute-ram').inputValue(),'48 GB');
  assert.equal(await page.locator('#attribute-rom').inputValue(),'6 TB');
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  await open();
  const fillAudio = async (name,power) => {
   await page.locator('#categoria').selectOption('audio');
   await page.locator('#nombre').fill(name); await page.locator('#marca').fill('Marca');
   await page.locator('#attribute-potencia').fill(power);
  };
  await fillAudio('Modelo','20');
  await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
  await dialog.getByRole('alert').waitFor();
  assert.equal(alerts,1); assert.equal(writes,1);
  assert((await dialog.getByRole('alert').textContent()).includes('Ya existe'));
  assert.equal(await dialog.getByRole('alert').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=18),true);
  await page.locator('#attribute-potencia').fill('40');
  await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  const saved=(await snapshot()).products.find(p=>p.nombre==='Modelo' && p.atributos.potencia==='40');
  assert(saved);
  await page.getByRole('row').filter({has:page.getByRole('cell',{name:String(saved.id),exact:true})}).getByRole('button',{name:'Modificar'}).click();
  assert.equal(await page.locator('#attribute-potencia').inputValue(),'40');
  await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  await open(); await fillAudio('Concurrente','25'); rejectWrite=true;
  await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
  await dialog.getByRole('alert').waitFor(); assert.equal(alerts,2); rejectWrite=false;
  await page.setViewportSize({width:390,height:844});
  assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
  fs.mkdirSync('tests/artifacts',{recursive:true});
  await page.screenshot({path:'tests/artifacts/data-mobile.png',fullPage:true});
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Volver a Datos'}).click();
  for(const [catalog,singular] of [['Proveedores','proveedor'],['Clientes','cliente'],['Vendedores','vendedor']]) {
   await page.getByRole('button',{name:new RegExp(catalog+'.*elementos creados')}).click();
   await page.getByRole('button',{name:'Nuevo '+singular,exact:true}).click();
   assert.equal(await dialog.locator('form').count(),1);
   await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
   await page.getByRole('button',{name:'Volver a Datos'}).click();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: migrations, database duplicates, 15 categories, create/edit, duplicate alerts, mobile and shared modals');
 } finally { if(browser) await browser.close(); await db.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
