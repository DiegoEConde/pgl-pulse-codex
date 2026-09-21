const assert=require("node:assert/strict");
const fs=require("node:fs");
const {chromium}=require(process.env.PGL_PLAYWRIGHT_PATH||process.env.TEMP+"/pandasoft-validation/node_modules/playwright");
const day=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
// Las capturas y los PDF se regeneran en una carpeta ignorada por Git.
fs.mkdirSync("tests/artifacts",{recursive:true});
const snapshot={products:[],suppliers:[{id:1,nombre:"Jacinto"},{id:2,nombre:"Roman"}],clients:[{id:1,nombre:"Cliente Uno"},{id:2,nombre:"Cliente Dos"}],sellers:[{id:1,nombre:"Ana"},{id:2,nombre:"Luis"},{id:3,nombre:"Sin ventas"}],orders:[],lines:[],units:[],charts:[]};
for(let id=1;id<=12;id++){
 snapshot.products.push({id,marca:"Samsung",nombre:"Equipo "+id,categoria:"Celulares"});
 snapshot.orders.push({id,proveedor_id:id%2?1:2,estado:"PEDIDO",fecha_pedido:day+"T12:00:00-03:00",costo_envio_usd:0,cerrado_en:null});
 snapshot.lines.push({id,pedido_id:id,producto_id:id,color:"Negro",cantidad:id,precio_costo_usd:100});
}
for(let id=1;id<=2;id++)snapshot.units.push({id,pedido_id:id,producto_id:id,cliente_id:id,vendedor_id:id,estado:"ENTREGADA",fecha_venta:day+"T12:00:00-03:00",precio_costo_usd:100,costo_envio_usd:0,precio_venta_usd:id===1?200:250,comision_usd:10,pago_verificado:id===1,fecha_ingreso_stock:day+"T12:00:00-03:00"});
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce",acceptDownloads:true});const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/rest/v1/**",route=>{assert.ok(route.request().url().endsWith("/rpc/pgl_snapshot"),"Unexpected database access");return route.fulfill({json:snapshot});});
  await page.goto(process.env.PGL_TEST_URL||"http://localhost:3000",{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"Actualizar datos"}).waitFor();await page.getByRole("navigation").getByRole("button",{name:"Reportes",exact:true}).click();
  await page.getByRole("heading",{name:"Reportes",exact:true}).waitFor();
  const metrics=page.locator('[role="tabpanel"] .metric');
  assert.equal(await metrics.count(),4);assert.equal(await metrics.nth(1).locator("strong").textContent(),"78");
  assert.ok((await metrics.nth(0).innerText()).includes("7.800"));assert.ok((await metrics.nth(2).innerText()).includes("450"));assert.ok((await metrics.nth(3).innerText()).includes("230"));
  assert.equal(await page.getByRole("button",{name:"Agregar al Dashboard",exact:true}).count(),0);
  assert.equal(await page.locator('[role="tabpanel"] svg[role="img"] title').count(),12);
  for(const period of ["Mes","Semestre","Año"]){await page.getByRole("tab",{name:period,exact:true}).click();assert.equal(await page.locator('[role="tabpanel"] svg[role="img"] title').count(),10);}
  await page.getByRole("combobox",{name:"Distribución por",exact:true}).selectOption("clients");assert.equal(await page.locator('[role="tabpanel"] svg[role="img"] title').count(),2);
  await page.getByRole("combobox",{name:"Ranking de",exact:true}).selectOption("suppliers");assert.ok((await page.locator('[role="tabpanel"] ol li').first().innerText()).includes("Roman"));
  for(const mode of ["purchasedUnits","soldUnits","suppliers","clients","sellers"]) { await page.getByRole("combobox",{name:"Distribución por",exact:true}).selectOption(mode); assert.ok(await page.locator('[role="tabpanel"] svg[role="img"] title').count()); }
  for(const mode of ["bestSellers","products","soldProducts","clients","suppliers"]) { await page.getByRole("combobox",{name:"Ranking de",exact:true}).selectOption(mode); assert.ok(await page.locator('[role="tabpanel"] ol li').count()<=5); }
  await page.getByRole("tab",{name:"Mes",exact:true}).click();
  assert.equal(await page.getByLabel("Mes del reporte",{exact:true}).getAttribute("type"),"month");
  await page.getByLabel("Mes del reporte",{exact:true}).fill("2020-02");assert.equal(await metrics.nth(1).locator("strong").textContent(),"0");
  await page.getByRole("tab",{name:"Semestre",exact:true}).click();
  await page.getByLabel("Mes final del semestre",{exact:true}).fill("2020-02");assert.equal(await metrics.nth(1).locator("strong").textContent(),"0");
  await page.getByRole("tab",{name:"Mes",exact:true}).click();assert.equal(await page.getByLabel("Mes del reporte",{exact:true}).inputValue(),"2020-02");
  await page.getByLabel("Mes del reporte",{exact:true}).fill(day.slice(0,7));
  await page.getByRole("tab",{name:"Semestre",exact:true}).click();await page.getByLabel("Mes final del semestre",{exact:true}).fill(day.slice(0,7));
  await page.getByRole("tab",{name:"Año",exact:true}).click();await page.getByLabel("Año del reporte",{exact:true}).selectOption(String(Number(day.slice(0,4))-1));assert.equal(await metrics.nth(1).locator("strong").textContent(),"0");
  await page.getByLabel("Año del reporte",{exact:true}).selectOption(day.slice(0,4));
  async function pdf(button,file){
   const downloadPromise=page.waitForEvent("download");await button.click();const download=await downloadPromise;await download.saveAs(file);
   const bytes=fs.readFileSync(file);assert.ok(bytes.subarray(0,5).toString()==="%PDF-");assert.ok(bytes.length>2000);assert.equal(await download.failure(),null);
  }
  await pdf(page.getByRole("button",{name:"Exportar a PDF",exact:true}),"tests/artifacts/reports-current.pdf");
  await page.getByRole("button",{name:"Reporte personalizado",exact:true}).click();
  assert.equal(await page.getByLabel("Título",{exact:true}).count(),0);
  await page.getByRole("button",{name:/Gráfico Elegí/}).click();
  await page.getByRole("button",{name:/Barras horizontales/}).click();
  assert.equal(await page.getByRole("button",{name:/Lista ordenada Compará/}).count(),0);
  assert.equal(await page.getByRole("button",{name:/^Columnas/}).count(),0);
  await page.getByLabel("Título",{exact:true}).fill("Ventas de Ana");
  await page.getByRole("button",{name:"Volver",exact:true}).click();
  await page.getByRole("button",{name:/Barras horizontales/}).click();
  assert.equal(await page.getByLabel("Título",{exact:true}).inputValue(),"Ventas de Ana");
  await page.getByLabel("Qué medir",{exact:true}).selectOption("revenue");
  await page.getByLabel("Vendedor",{exact:true}).selectOption("1");
  await page.getByLabel("Agrupar por",{exact:true}).selectOption("client");
  await page.getByRole("button",{name:"Generar reporte",exact:true}).click();
  const result=page.getByRole("region",{name:"Resultado del reporte",exact:true});await result.waitFor();assert.ok((await result.innerText()).includes("Cliente Uno"));assert.ok(!(await result.innerText()).includes("Cliente Dos"));
  await pdf(result.getByRole("button",{name:"Exportar a PDF",exact:true}),"tests/artifacts/reports-custom.pdf");
  await result.getByRole("button",{name:"Editar informe",exact:true}).click();
  assert.equal(await page.getByLabel("Título",{exact:true}).inputValue(),"Ventas de Ana");
  for(const name of ["Columnas","Líneas","Circular"]) {
   await page.getByRole("button",{name:"Volver",exact:true}).click();
   await page.getByRole("button",{name:new RegExp("^"+name)}).click();
   if(name==="Líneas")assert.deepEqual(await page.getByLabel("Agrupar por",{exact:true}).locator('option').evaluateAll(nodes=>nodes.map(n=>n.value)),["day","month"]);
   await page.getByRole("button",{name:"Generar reporte",exact:true}).click();
   await result.getByRole("img",{name,exact:true}).waitFor();
   await pdf(result.getByRole("button",{name:"Exportar a PDF",exact:true}),"tests/artifacts/reports-"+name+".pdf");
   await result.getByRole("button",{name:"Editar informe",exact:true}).click();
  }
  await page.getByRole("button",{name:"Volver",exact:true}).click();
  await page.getByRole("button",{name:"Volver",exact:true}).click();
  await page.getByRole("button",{name:/Lista ordenada Compará/}).click();
  await page.getByLabel("Qué medir",{exact:true}).selectOption("purchasedUnits");
  await page.getByLabel("Agrupar por",{exact:true}).selectOption("supplier");
  assert.equal(await page.getByLabel("Vendedor",{exact:true}).count(),0);
  await page.getByRole("button",{name:"Generar reporte",exact:true}).click();
  await result.getByText("Unidades compradas por proveedor",{exact:true}).waitFor();
  assert.equal(await result.locator('svg[role="img"]').count(),0);
  assert.equal(await result.getByRole("row").count(),3);
  await pdf(result.getByRole("button",{name:"Exportar a PDF",exact:true}),"tests/artifacts/reports-list.pdf");
  await page.keyboard.press("Escape");assert.equal(await page.getByRole("dialog").count(),0);
  await page.getByRole("button",{name:"Resumen de vendedores",exact:true}).click();
  const seller=page.getByRole("dialog",{name:"Resumen de vendedores",exact:true});
  await seller.getByRole("button",{name:"Ana",exact:true}).click();await seller.getByText("Ticket promedio",{exact:true}).waitFor();assert.ok((await seller.innerText()).includes("200"));
  await seller.getByRole("button",{name:"Sin ventas",exact:true}).click();await seller.getByText("Sin ventas en este período.",{exact:true}).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("combobox",{name:"Distribución por",exact:true}).selectOption("purchasedUnits");
  await page.getByRole("combobox",{name:"Ranking de",exact:true}).selectOption("products");
  for(const [width,height] of [[1440,900],[1280,720],[1024,600],[768,1024],[820,600],[390,844]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
   assert.ok(size.sw<=size.w+1,"Horizontal overflow "+JSON.stringify(size));
   if(width>740)assert.ok(size.sh<=size.h+1,"Vertical overflow "+JSON.stringify(size));
   await page.getByRole("button",{name:"Reporte personalizado",exact:true}).click();
   const dialog=page.getByRole("dialog");const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
   await dialog.getByRole("button",{name:/Gráfico Elegí/}).click();
   await dialog.getByRole("button",{name:/Barras horizontales/}).click();
   await dialog.getByRole("button",{name:"Generar reporte",exact:true}).click();
   await dialog.getByRole("img",{name:"Barras horizontales",exact:true}).waitFor();
   assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),"Custom result overflow");
   if(width===390)await page.screenshot({path:"tests/artifacts/reports-custom-mobile.png",fullPage:true});
   await page.keyboard.press("Escape");
  }
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:"tests/artifacts/reports-mobile.png",fullPage:true});await page.setViewportSize({width:1440,height:900});await page.screenshot({path:"tests/artifacts/reports-desktop.png",fullPage:true});
  assert.deepEqual(errors,[]);console.log("PASS: KPIs, periods, top 10, rankings, custom report, seller summary, PDF downloads and 6 viewports");
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
