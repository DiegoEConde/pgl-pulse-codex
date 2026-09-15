const fs=require("node:fs");
const assert=require("node:assert/strict");
const {chromium}=require(process.env.PGL_PLAYWRIGHT_PATH || process.env.TEMP+"/pandasoft-validation/node_modules/playwright");
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const snapshot={products:[{id:1,marca:'Test',nombre:'Equipo',categoria:'Test'}],suppliers:[{id:1,nombre:'Proveedor'}],clients:[{id:1,nombre:'Cliente'}],sellers:[{id:1,nombre:'Vendedor',porcentaje_comision:5}],orders:[],lines:[],charts:[],salePayments:[],units:[{id:1,producto_id:1,pedido_id:1,estado:'STOCK',color:'Negro',fecha_ingreso_stock:day+'T12:00:00-03:00',precio_costo_usd:10,costo_envio_usd:0,precio_sugerido_usd:100,cobrado_inicial_usd:0,pago_verificado:false}]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let calls=0;let failAfterSave=true;let failNextSnapshot=false;
  // Solo prueba de interfaz: toda solicitud REST se intercepta, nunca escribe en Supabase.
  await page.route('**/rest/v1/**',async route=>{
   const url=route.request().url();
   if(url.endsWith('/rpc/pgl_snapshot')){
    if(failNextSnapshot){return route.fulfill({status:500,json:{message:'Error de actualización simulado'}});}
    return route.fulfill({json:snapshot});
   }
   const body=route.request().postDataJSON();const unit=snapshot.units[0];
   if(url.endsWith('/rpc/pgl_create_sale_partial')){
    Object.assign(unit,{estado:body.p_delivered?'ENTREGADA':'REPARTO',fecha_venta:day+'T12:00:00-03:00',cliente_id:1,vendedor_id:1,precio_venta_usd:body.p_price,comision_usd:body.p_commission,solicitud_venta_id:body.p_request});
    snapshot.salePayments.push({id:1,unidad_id:1,importe_usd:body.p_amount,solicitud_id:body.p_request,registrado_en:new Date().toISOString()});
    return route.fulfill({json:1});
   }
   if(url.endsWith('/rpc/pgl_add_sale_payment')){
    calls++;
    if(!snapshot.salePayments.some(p=>p.solicitud_id===body.p_request))snapshot.salePayments.push({id:snapshot.salePayments.length+1,unidad_id:1,importe_usd:body.p_amount,solicitud_id:body.p_request,registrado_en:new Date().toISOString()});
    if(body.p_delivered){unit.estado='ENTREGADA';unit.fecha_entrega=new Date().toISOString();}
    unit.pago_verificado=snapshot.salePayments.reduce((n,p)=>n+p.importe_usd,0)===100;
    if(failAfterSave){failAfterSave=false;return route.fulfill({status:500,json:{message:'Respuesta perdida'}});}
    if(calls===2)failNextSnapshot=true;
    return route.fulfill({json:snapshot.salePayments.length});
   }
   throw Error('Solicitud inesperada: '+url);
  });
  await page.goto(process.env.PGL_TEST_URL||'http://localhost:3000',{waitUntil:'networkidle'});
  await page.getByRole('navigation').getByRole('button',{name:'Ventas',exact:true}).click();
  await page.getByRole('button',{name:'Nueva venta',exact:true}).click();
  await page.locator('#client').selectOption('1');await page.locator('#seller').selectOption('1');await page.locator('#amount').fill('40');
  await page.getByRole('button',{name:'Guardar venta',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Venta 1',exact:true});await dialog.waitFor();
  assert.equal(await dialog.getByRole('listitem').count(),1);
  await page.locator('#payment-amount').fill('40');await page.getByRole('button',{name:'Registrar abono',exact:true}).click();
  await dialog.getByRole('alert').waitFor();
  await page.getByRole('button',{name:'Registrar abono',exact:true}).click();
  await page.getByRole('button',{name:'Reintentar conexión',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Registrar abono',exact:true}).count(),0);
  failNextSnapshot=false;
  await page.getByRole('button',{name:'Reintentar conexión',exact:true}).click();
  await page.getByRole('button',{name:'Ver venta 1',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('[role="dialog"] li').length===2);
  assert.equal(calls,2);assert.equal(snapshot.salePayments.length,2);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#payment-amount').fill('20');
  await page.getByRole('button',{name:'Registrar abono',exact:true}).click();
  assert.equal(calls,2,'No permite completar sin confirmar retiro');
  await dialog.getByRole('checkbox').check();await page.getByRole('button',{name:'Registrar abono',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('[role="dialog"] li').length===3);
  assert.equal(await page.locator('#payment-amount').count(),0);
  assert.equal(snapshot.units[0].pago_verificado,true);
  fs.mkdirSync('tests/artifacts',{recursive:true});await page.screenshot({path:'tests/artifacts/b2-payments-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Cerrar venta',exact:true}).click();
  await page.reload({waitUntil:'networkidle'});
  const menu=page.getByRole('button',{name:/Abrir men/});await menu.waitFor();await menu.click();
  await page.getByRole('navigation').getByRole('button',{name:'Ventas',exact:true}).click();
  await page.getByRole('button',{name:'Ver venta 1',exact:true}).click({timeout:5000}).catch(async error=>{console.log(await page.locator('body').innerText());console.log(errors);throw error;});
  assert.equal(await page.getByRole('listitem').count(),3);
  await page.getByRole('button',{name:'Cerrar venta',exact:true}).click();
  await page.setViewportSize({width:1440,height:1100});
  delete snapshot.salePayments;
  await page.getByRole('button',{name:'Actualizar datos',exact:true}).click();
  await page.getByText('El registro de cobros todavía no está habilitado.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Nueva venta',exact:true}).isDisabled(),true);
  assert.deepEqual(errors,[]);console.log('B2 navegador: creación, historial, reintento, retiro, móvil, recarga y base sin migrar OK');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
