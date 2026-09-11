const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PGL_PLAYWRIGHT_PATH || path.join(process.env.TEMP, "pandasoft-validation/node_modules/playwright"));
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const prefix = "PGL-E2E-" + Date.now();
const result = { prefix, steps: [], ids: {} };
async function snapshot() { const { data, error } = await supabase.rpc("pgl_snapshot"); if (error) throw error; return data; }
(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const nav = name => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
  try {
    await page.goto(process.env.PGL_TEST_URL || "http://localhost:3100", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Actualizar datos" }).waitFor();
    assert.equal(await page.locator('input[type="password"]').count(), 0);
    for (const [catalog,singular,values] of [
      ["Productos","producto",{marca:"PGL TEST",nombre:prefix+" Producto",categoria:"Celulares"}],
      ["Proveedores","proveedor",{nombre:prefix+" Proveedor",telefono:"12345"}],
      ["Clientes","cliente",{nombre:prefix+' Cliente, "QA"',direccion:"Dirección de prueba",localidad:"Buenos Aires",telefono:"12345"}],
      ["Vendedores","vendedor",{nombre:prefix+" Vendedor",porcentaje_comision:"5"}],
    ]) {
      await nav("Datos");
      const back = page.getByRole("button", { name: "Volver a Datos", exact: true });
      if (await back.count()) await back.click();
      await page.getByRole("button", { name: new RegExp("^"+catalog) }).click();
      await page.getByRole("button", { name: "Nuevo "+singular, exact: true }).click();
      const dialog=page.getByRole("dialog");
      for(const [key,value] of Object.entries(values)) await dialog.locator('[name="'+key+'"]').fill(value);
      await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
      await dialog.waitFor({ state:"detached" });
    }
    let data=await snapshot();
    const product=data.products.find(row=>row.nombre===prefix+" Producto");
    const supplier=data.suppliers.find(row=>row.nombre===prefix+" Proveedor");
    const client=data.clients.find(row=>row.nombre.startsWith(prefix));
    const seller=data.sellers.find(row=>row.nombre===prefix+" Vendedor");
    assert.ok(product&&supplier&&client&&seller);
    result.ids={product:product.id,supplier:supplier.id,client:client.id,seller:seller.id};
    result.steps.push("Cuatro catálogos creados desde la interfaz sin sesión");
    await nav("Compras");
    await page.getByRole("button",{name:"Nueva compra",exact:true}).click();
    let dialog=page.getByRole("dialog");
    await dialog.locator('[name="supplier"]').selectOption(String(supplier.id));
    await dialog.locator('[name^="product-"]').selectOption(String(product.id));
    await dialog.locator('[name^="color-"]').fill("Negro");
    await dialog.locator('[name^="quantity-"]').fill("2");
    await dialog.locator('[name^="cost-"]').fill("10");
    await dialog.locator('[name="shipping"]').fill("0.05");
    await dialog.getByRole("button",{name:"Agregar producto",exact:true}).click();
    await dialog.locator('[name^="product-"]').nth(1).selectOption(String(product.id));
    await dialog.locator('[name^="color-"]').nth(1).fill("Blanco");
    await dialog.locator('[name^="quantity-"]').nth(1).fill("1");
    await dialog.locator('[name^="cost-"]').nth(1).fill("20");
    await dialog.getByRole("button",{name:"Crear borrador",exact:true}).click();
    await page.getByRole("button",{name:"Confirmar pedido",exact:true}).waitFor();
    data=await snapshot();
    const order=data.orders.find(row=>row.proveedor_id===supplier.id);
    result.ids.order=order.id;
    assert.equal(data.lines.filter(row=>row.pedido_id===order.id).length,2);
    await page.getByRole("button",{name:"Confirmar pedido",exact:true}).click();
    await page.getByRole("button",{name:"Registrar recepción",exact:true}).waitFor();
    await page.getByRole("button",{name:"Marcar en envío",exact:true}).click();
    await page.getByRole("button",{name:"Marcar en envío",exact:true}).waitFor({state:"detached"});
    await page.getByRole("button",{name:"Registrar recepción",exact:true}).click();
    dialog=page.getByRole("dialog");
    for(let index=0;index<3;index++){
      await dialog.locator('[name^="code-"]').nth(index).fill(prefix+"-"+index);
      await dialog.locator('[name^="variant-"]').nth(index).fill("128 GB");
      await dialog.locator('[name^="ram-"]').nth(index).fill("8 GB");
      await dialog.locator('[name^="price-"]').nth(index).fill("30");
    }
    await dialog.getByRole("button",{name:"Confirmar recepción",exact:true}).click();
    await dialog.getByText("3 unidades recibidas",{exact:true}).waitFor();
    await page.getByRole("button",{name:"Cerrar detalle",exact:true}).click();
    data=await snapshot();
    const units=data.units.filter(row=>row.pedido_id===order.id);
    result.ids.units=units.map(unit=>unit.id);
    assert.equal(units.length,3);
    assert.equal(Math.round(units.reduce((sum,unit)=>sum+unit.costo_envio_usd,0)*100),5);
    assert.ok(units.every(unit=>unit.estado==="STOCK"));
    result.steps.push("Compra de dos líneas recibida en Stock con envío exacto");
    await nav("Stock");
    await page.locator("tbody tr").filter({hasText:prefix+"-0"}).click();
    dialog=page.getByRole("dialog");
    await dialog.locator('[name="variant"]').fill("256 GB");
    await dialog.getByRole("button",{name:"Guardar unidad",exact:true}).click();
    await dialog.waitFor({state:"detached"});
    const target=units.find(unit=>unit.codigo===prefix+"-0");
    await nav("Ventas");
    await page.getByRole("button",{name:"Nueva venta",exact:true}).click();
    dialog=page.getByRole("dialog");
    await dialog.locator("#unit").selectOption(String(target.id));
    await dialog.locator('[name="client"]').selectOption(String(client.id));
    await dialog.locator('[name="seller"]').selectOption(String(seller.id));
    await dialog.locator('[name="price"]').fill("30");
    await dialog.locator('[name="commission"]').fill("1.50");
    await dialog.getByRole("button",{name:"Guardar venta",exact:true}).click();
    await page.getByRole("button",{name:"Verificar pago",exact:true}).waitFor();
    await page.getByRole("button",{name:"Cerrar venta",exact:true}).click();
    data=await snapshot();
    assert.equal(data.units.find(unit=>unit.id===target.id).estado,"REPARTO");
    await nav("Stock");
    assert.equal(await page.locator("tbody tr").filter({hasText:prefix+"-0"}).count(),0);
    await nav("Reparto");
    const row=page.locator("tbody tr").filter({hasText:prefix+"-0"});
    await row.getByRole("button",{name:"Verificar pago",exact:true}).click();
    await row.getByRole("button",{name:"Verificar pago",exact:true}).waitFor({state:"detached"});
    await row.getByRole("button",{name:"Confirmar entrega",exact:true}).click();
    await row.waitFor({state:"detached"});
    await page.getByRole("tab",{name:"Cierre del día",exact:true}).click();
    await page.getByRole("button",{name:"Finalizar pedidos del día",exact:true}).click();
    await page.getByRole("button",{name:"Finalizar pedidos del día",exact:true}).waitFor({state:"visible"});
    // Wait for the write and refresh, then assert the durable state.
    await page.waitForFunction(()=>document.querySelector(".connection-button")?.textContent.includes("Conectado"));
    await page.waitForTimeout(500);
    data=await snapshot();
    const sold=data.units.find(unit=>unit.id===target.id);
    assert.equal(sold.estado,"ENTREGADA"); assert.equal(sold.pago_verificado,true); assert.ok(sold.fecha_entrega);
    assert.ok(data.orders.find(row=>row.id===order.id).cerrado_en);
    result.steps.push("Venta, salida de Stock, pago, entrega y cierre persistidos");
    await nav("Reportes");
    assert.equal(await page.getByText("NaN%",{exact:true}).count(),0);
    await page.getByRole("tab",{name:"Constructor",exact:true}).click();
    const title=page.locator('input').first();
    await title.fill(prefix+" Informe");
    await page.getByRole("button",{name:"Agregar al Dashboard",exact:true}).first().click();
    await page.getByRole("tab",{name:"Guardados",exact:true}).click();
    await page.getByText(prefix+" Informe",{exact:true}).last().waitFor();
    await page.getByRole("tab",{name:"Constructor",exact:true}).click();
    const download=page.waitForEvent("download");
    await page.getByRole("button",{name:"Exportar CSV",exact:true}).click();
    const file=await download;
    const csv=fs.readFileSync(await file.path(),"utf8");
    assert.ok(csv.includes('Cliente, ""QA""'));
    data=await snapshot();
    const chart=data.charts.find(row=>row.title===prefix+" Informe");
    assert.ok(chart); result.ids.chart=chart.id;
    await page.reload({waitUntil:"networkidle"});
    await nav("Reportes");
    await page.getByRole("tab",{name:"Guardados",exact:true}).click();
    await page.getByText(prefix+" Informe",{exact:true}).waitFor();
    await nav("Compras");
    await page.getByRole("tab",{name:"Historial",exact:true}).click();
    await page.getByRole("button",{name:"Ver pedido "+order.id,exact:true}).waitFor();
    result.steps.push("Reportes reales, CSV escapado y persistencia tras recargar");
    await page.setViewportSize({width:390,height:844});
    for(const name of ["Inicio","Compras","Ventas","Reparto","Stock","Datos","Reportes"]){
      const menu=page.getByRole("button",{name:"Abrir menú",exact:true});
      if(await menu.isVisible()) await menu.click();
      await nav(name);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),name+" desborda en móvil");
    }
    await page.waitForTimeout(350);
    await page.screenshot({path:"tests/integration-mobile.png",fullPage:true});
    const raceUnit=units.find(unit=>unit.id!==target.id);
    const args={p_unit:raceUnit.id,p_client:client.id,p_seller:seller.id,p_date:sold.fecha_venta.slice(0,10),p_price:25,p_commission:1,p_paid:false};
    const race=await Promise.all([supabase.rpc("pgl_create_sale",{...args,p_request:crypto.randomUUID()}),supabase.rpc("pgl_create_sale",{...args,p_request:crypto.randomUUID()})]);
    assert.equal(race.filter(response=>!response.error).length,1);
    assert.equal(race.filter(response=>response.error?.code==="P0001").length,1);
    result.steps.push("Dos ventas concurrentes de la misma unidad: una sola aceptada");
    result.steps.push("Siete pantallas sin desbordamiento horizontal a 390 px");
    assert.deepEqual(errors,[]);
    result.success=true;
  } catch(error) {
    result.success=false; result.error=error.stack;
    await page.screenshot({path:"tests/integration-failure.png",fullPage:true});
    process.exitCode=1;
  } finally {
    fs.writeFileSync("tests/integration-result.json",JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
