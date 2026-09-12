const fs=require("node:fs");
const assert=require("node:assert/strict");
const {chromium}=require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP+"/pandasoft-validation/node_modules/playwright");
// Las capturas y los PDF se regeneran en una carpeta ignorada por Git.
fs.mkdirSync("tests/artifacts",{recursive:true});
const snapshot={products:[{id:1,marca:"Apple",nombre:"iPhone 15",categoria:"Celulares"}],suppliers:[
{id:1,nombre:"Jacinto",direccion:"Calle de Prueba 1500",telefono:"011 0000-1500",horario_desde:"15:00:00",horario_hasta:"16:00:00"},
{id:2,nombre:"Roman",direccion:"Calle de Prueba 1400",telefono:"011 0000-1400",horario_desde:"14:00:00",horario_hasta:"16:00:00"},
{id:3,nombre:"Anselmo",direccion:"Calle de Prueba 1000",telefono:"011 0000-1000",horario_desde:"10:00:00",horario_hasta:"20:00:00"}],orders:[],lines:[],clients:[],sellers:[],units:[],charts:[]};
(async()=>{
const browser=await chromium.launch({executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:"reduce"});const errors=[];page.on("pageerror",e=>errors.push(e.message));
 // Block any unmocked writes: all test purchases remain in this in-memory snapshot.
 await page.route("**/rest/v1/**",async route=>{
  const url=route.request().url();
  if(url.endsWith("/rpc/pgl_snapshot")) return route.fulfill({json:snapshot});
  if(url.endsWith("/rpc/pgl_create_order")) {
   const body=route.request().postDataJSON();const id=snapshot.orders.length+1;
   snapshot.orders.push({id,proveedor_id:body.p_supplier,fecha_pedido:body.p_date+"T12:00:00-03:00",fecha_estimada:body.p_expected,costo_envio_usd:body.p_shipping,observaciones:body.p_notes,estado:"BORRADOR",cerrado_en:null});
   body.p_lines.forEach(line=>snapshot.lines.push({...line,id:snapshot.lines.length+1,pedido_id:id}));
   return route.fulfill({json:id});
  }
  throw Error("Unexpected database request "+url);
 });
 await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
 await page.goto(process.env.PGL_TEST_URL||"http://localhost:3000",{waitUntil:"networkidle"});
 await page.getByRole("button",{name:"Actualizar datos"}).waitFor();
 async function nav(name){const menu=page.getByRole("button",{name:/Abrir men/});if(await menu.isVisible())await menu.click();await page.getByRole("navigation").getByRole("button",{name,exact:true}).click();}
 await nav("Reparto");await page.getByText("Todavía no hay repartos").waitFor();
 for(const supplier of [1,1,2,3]){
  await nav("Compras");await page.getByRole("button",{name:"Nueva compra",exact:true}).click();
  await page.locator("#supplier").selectOption(String(supplier));await page.locator('select[id^="product-"]').selectOption("1");
  await page.locator('input[id^="color-"]').fill("Negro");await page.locator('input[id^="cost-"]').fill("450.25");
  await page.locator('input[id^="memory-ram-"]').fill("12");await page.locator('input[id^="memory-rom-"]').fill("128");
  await page.locator("#notes").fill("Llamar antes");
  await page.getByRole("button",{name:"Crear borrador",exact:true}).click();
  await page.getByRole("button",{name:"Cerrar detalle",exact:true}).click();
  await nav("Reparto");
 }
 assert.deepEqual(await page.locator("article h2").allTextContents(),["Anselmo","Roman","Jacinto"]);
 const jacinto=page.getByRole("article",{name:"Reparto de Jacinto",exact:true});
 await jacinto.getByText("2 pedidos · 2 unidades").waitFor();
 assert.equal(await jacinto.getByText("12 / 128 GB",{exact:true}).count(),2);
 assert.equal(await jacinto.getByText("Apple · iPhone 15",{exact:true}).count(),2);
 await jacinto.getByText("Calle de Prueba 1500",{exact:true}).waitFor();
 await page.reload({waitUntil:"networkidle"});await nav("Reparto");await page.getByRole("article",{name:"Reparto de Jacinto",exact:true}).waitFor();
 for(const [width,height] of [[1440,900],[1280,720],[1024,600],[768,1024],[820,600],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
  assert.ok(size.sw<=size.w+1,"Horizontal overflow "+JSON.stringify(size));
  assert.equal(await page.locator("article").count(),3);
  await page.getByText("3 paradas", {exact:true}).waitFor();
 }
 await page.setViewportSize({width:1440,height:1100});
 // More lines in one supplier must stay accessible.
 for(let id=5;id<=12;id++){snapshot.orders.push({...snapshot.orders[0],id});snapshot.lines.push({...snapshot.lines[0],id,pedido_id:id});}
 await page.getByRole("button",{name:"Actualizar datos"}).click();
 await page.getByRole("button",{name:"Productos siguientes de Jacinto"}).click();
 await page.getByRole("article",{name:"Reparto de Jacinto",exact:true}).getByText("Pedido #5 · Borrador",{exact:true}).waitFor();
 await page.getByRole("button",{name:"Generar reparto",exact:true}).click();
 await page.getByRole("status").getByText("Reparto copiado",{exact:true}).waitFor();
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal((copied.match(/APPLE IPHONE 15/g)||[]).length,12);
 assert.ok(copied.includes("*(TOTAL: USD 4502.50)*"));
 assert.ok(copied.indexOf("*ANSELMO") < copied.indexOf("*ROMAN"));
 assert.ok(copied.includes("12/128 GB - $ 450.25"));
 await page.screenshot({path:"tests/artifacts/delivery-desktop.png",fullPage:true});
 assert.deepEqual(errors,[]);console.log("PASS: create purchases, grouping, time order, RAM/ROM, reload, pagination and 6 viewports.");
}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
