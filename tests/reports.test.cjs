const {test}=require("node:test");
const assert=require("node:assert/strict");const fs=require("node:fs");const ts=require("typescript");
function load(file,deps={}){const output=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};new Function("require","exports",output)(name=>{if(name in deps)return deps[name];throw Error(name);},exports);return exports;}
const reports=load("lib/reports.ts",{"./dates":load("lib/dates.ts")});
function fixture(){return {products:[{id:1,marca:"Apple",nombre:"iPhone"},{id:2,marca:"Samsung",nombre:"A16"}],suppliers:[{id:1,nombre:"Jacinto"},{id:2,nombre:"Roman"}],clients:[{id:1,nombre:"Cliente"},{id:2,nombre:"Cliente"}],sellers:[{id:1,nombre:"Ana"},{id:2,nombre:"Luis"}],charts:[],orders:[
{id:1,proveedor_id:1,fecha_pedido:"2026-08-20T12:00:00-03:00",estado:"RECIBIDO",costo_envio_usd:0.05},
{id:2,proveedor_id:2,fecha_pedido:"2026-09-11T12:00:00-03:00",estado:"PEDIDO",costo_envio_usd:0.05},
{id:3,proveedor_id:1,fecha_pedido:"2026-09-11T12:00:00-03:00",estado:"BORRADOR",costo_envio_usd:0},
],lines:[{id:1,pedido_id:1,producto_id:1,cantidad:1,precio_costo_usd:100},{id:2,pedido_id:2,producto_id:1,cantidad:2,precio_costo_usd:10},{id:3,pedido_id:2,producto_id:2,cantidad:1,precio_costo_usd:20},{id:4,pedido_id:3,producto_id:1,cantidad:50,precio_costo_usd:1000}],
units:[{id:1,pedido_id:1,producto_id:1,cliente_id:1,vendedor_id:1,estado:"ENTREGADA",fecha_venta:"2026-09-11T12:00:00-03:00",precio_costo_usd:100,costo_envio_usd:0.05,precio_venta_usd:150,comision_usd:5,pago_verificado:true},
{id:2,pedido_id:1,producto_id:2,cliente_id:2,vendedor_id:2,estado:"REPARTO",fecha_venta:"2026-09-11T12:00:00-03:00",precio_costo_usd:20,costo_envio_usd:0,precio_venta_usd:100,comision_usd:10,pago_verificado:false},
{id:3,pedido_id:1,producto_id:1,estado:"STOCK",fecha_venta:null,precio_costo_usd:100,costo_envio_usd:0}]
};}
test("Periodos de Buenos Aires: hoy, mes, semestre movil y año",()=>{
 assert.deepEqual(reports.periodRange("today","2026-09-11"),{start:"2026-09-11",end:"2026-09-11"});
 assert.equal(reports.periodRange("month","2026-09-11").start,"2026-09-01");
 assert.equal(reports.periodRange("semester","2026-06-30").start,"2026-01-01");
 assert.equal(reports.periodRange("semester","2026-07-01").start,"2026-02-01");
 assert.equal(reports.periodRange("year","2026-01-01").start,"2026-01-01");
});
test("Compras confirmadas se cuentan antes de recibir y borradores se excluyen",()=>{
 const r=reports.makeReport(reports.reportFacts(fixture()),reports.periodRange("today","2026-09-11"));
 assert.equal(r.units,3);assert.equal(r.cost,40.05);assert.equal(r.revenue,250);assert.equal(r.profit,114.95);assert.equal(r.commission,15);
});
test("La venta de stock antiguo no modifica la fecha de compra",()=>{
 const facts=reports.reportFacts(fixture());
 const month=reports.makeReport(facts,reports.periodRange("month","2026-09-11"));
 const semester=reports.makeReport(facts,reports.periodRange("semester","2026-09-11"));
 assert.equal(month.units,3);assert.equal(semester.units,4);assert.equal(semester.cost,140.1);assert.equal(month.revenue,semester.revenue);
});
test("Envío prorrateado conserva centavos al filtrar productos",()=>{
 const facts=reports.reportFacts(fixture()),filter=reports.periodRange("today","2026-09-11");
 const first=reports.makeReport(facts,{...filter,product:"1"}),second=reports.makeReport(facts,{...filter,product:"2"});
 assert.equal(first.cost,20.04);assert.equal(second.cost,20.01);
});
test("Ranking de vendedores usa ganancia y no facturación",()=>{
 const r=reports.makeReport(reports.reportFacts(fixture()),reports.periodRange("today","2026-09-11"));
 assert.deepEqual(reports.productiveSellers(r).map(x=>x.name),["Luis","Ana"]);
 assert.deepEqual(reports.reportSlices(r,"clients").map(x=>x.value),[1,1]);
 assert.deepEqual(reports.reportSlices(r,"soldUnits").map(x=>x.value),[1,1]);
 assert.deepEqual(reports.reportSlices(r,"suppliers").map(x=>x.value),[3]);
});
test("Top 10 respeta empates y conserva todos los segmentos para Hoy",()=>{
 const raw=fixture();for(let id=3;id<=14;id++){raw.products.push({id,marca:"M",nombre:"Equipo "+id});raw.lines.push({id:id+10,pedido_id:2,producto_id:id,cantidad:1,precio_costo_usd:id});}
 const r=reports.makeReport(reports.reportFacts(raw),reports.periodRange("today","2026-09-11"));
 assert.equal(reports.reportSlices(r,"purchasedUnits").length,14);assert.equal(reports.reportSlices(r,"purchasedUnits",true).length,10);
 assert.equal(reports.expensiveProducts(r).length,5);
});
test("Filtros de vendedor y cliente y rangos vacíos",()=>{
 const facts=reports.reportFacts(fixture()),filter=reports.periodRange("today","2026-09-11");
 const seller=reports.makeReport(facts,{...filter,scope:"sales",seller:"1",client:"1"});
 assert.equal(seller.soldUnits,1);assert.equal(seller.commission,5);assert.equal(seller.paid,1);assert.equal(seller.profit,44.95);
 assert.equal(reports.makeReport(facts,{start:"2026-10-01",end:"2026-10-31"}).revenue,0);
});
test("Fechas UTC cerca de medianoche corresponden al día anterior en Buenos Aires",()=>{
 const raw=fixture();raw.units[0].fecha_venta="2026-09-12T01:00:00Z";
 assert.equal(reports.reportFacts(raw).sales[0].date,"2026-09-11");
});
test("Ganancias negativas, pagos pendientes y cierre conservan su significado",()=>{
 const raw=fixture();raw.units[0].precio_venta_usd=0;raw.orders[1].cerrado_en="2026-09-11T20:00:00Z";
 const r=reports.makeReport(reports.reportFacts(raw),reports.periodRange("today","2026-09-11"));
 assert.equal(r.units,3);assert.equal(r.profit,-35.05);assert.equal(r.paid,1);
});

test("Selecciones históricas incluyen el período completo y seis meses cruzando año",()=>{
 assert.deepEqual(reports.periodRange("month","2026-09-11","2024-02"),{start:"2024-02-01",end:"2024-02-29"});
 assert.deepEqual(reports.periodRange("semester","2026-09-11","2026-02"),{start:"2025-09-01",end:"2026-02-28"});
 assert.deepEqual(reports.periodRange("year","2026-09-11","2025"),{start:"2025-01-01",end:"2025-12-31"});
 assert.deepEqual(reports.periodRange("today","2026-09-11","2026-08-21"),{start:"2026-08-21",end:"2026-08-21"});
 assert.equal(reports.periodRange("month","2026-09-11","2026-09").end,"2026-09-11");
});

test("Nuevos rankings agrupan cantidades por ID y limitan a cinco",()=>{
 const raw=fixture();raw.units.push({...raw.units[0],id:8});
 const r=reports.makeReport(reports.reportFacts(raw),reports.periodRange("today","2026-09-11"));
 assert.equal(reports.reportRanking(r,"bestSellers")[0].value,2);
 assert.equal(reports.reportRanking(r,"clients")[0].value,2);
 assert.equal(reports.reportRanking(r,"suppliers")[0].value,3);
 assert.equal(reports.reportSlices(r,"sellers")[0].label,"Ana");
});
test("Series personalizadas: promedios ponderados, negativos, filtros y fechas sin actividad",()=>{
 const raw=fixture();raw.units.push({...raw.units[0],id:8,precio_venta_usd:0});
 const r=reports.makeReport(reports.reportFacts(raw),{start:"2026-09-10",end:"2026-09-12"});
 const config={chart:"list",metric:"averageSale",dimension:"product",order:"desc",limit:0};
 assert.equal(reports.customSeries(r,config).find(x=>x.id==="1").value,75);
 assert.ok(reports.customSeries(r,{...config,metric:"profit"}).some(x=>x.value<0));
 assert.deepEqual(reports.customSeries(r,{...config,metric:"soldUnits",dimension:"day",chart:"line",limit:1}).map(x=>x.value),[0,3,0]);
 assert.equal(reports.customSeries(r,{...config,metric:"purchaseCost"}).reduce((s,x)=>s+x.value,0),40.05);
 const pie=reports.customSeries(r,{...config,chart:"pie",metric:"soldUnits",limit:1});
 assert.equal(pie.at(-1).label,"Otros");assert.equal(pie.reduce((s,x)=>s+x.value,0),3);
 const empty=reports.makeReport(reports.reportFacts(raw),{start:"2020-01-01",end:"2020-01-02"});
 assert.deepEqual(reports.customSeries(empty,config),[]);
});

test("Más caros vendidos usa el precio máximo por producto, no la facturación ni el costo",()=>{
 const raw=fixture();
 raw.units.push({...raw.units[0],id:8,precio_venta_usd:50});
 raw.units.push({...raw.units[0],id:9,precio_venta_usd:9999,fecha_venta:"2025-01-01"});
 for(let id=3;id<=8;id++){raw.products.push({id,marca:"M",nombre:"Equipo "+id});raw.units.push({...raw.units[0],id:20+id,producto_id:id,precio_venta_usd:id*100});}
 const r=reports.makeReport(reports.reportFacts(raw),reports.periodRange("today","2026-09-11"));
 assert.deepEqual(reports.reportRanking(r,"soldProducts").map(x=>x.value),[800,700,600,500,400]);
 const one=reports.makeReport(reports.reportFacts(raw),{...r.filter,product:"1"});
 assert.equal(reports.reportRanking(one,"soldProducts")[0].value,150);
 assert.equal(reports.reportRanking(one,"products")[0].value,10);
 const empty=reports.makeReport(reports.reportFacts(raw),{start:"2020-01-01",end:"2020-01-02"});
 assert.deepEqual(reports.reportRanking(empty,"soldProducts"),[]);
});
