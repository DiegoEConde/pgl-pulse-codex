const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
function load(file,deps={}) {
 const output=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};new Function("require","exports",output)(name=>{if(name in deps)return deps[name];throw Error("Unexpected import: "+name);},exports);return exports;
}
const dates=load("lib/dates.ts");
const analytics=load("lib/analytics.ts");
const operations=load("lib/operations.ts",{"./dates":dates, "./purchase-details":load("lib/purchase-details.ts")});
test("La fecha operativa usa Buenos Aires incluso después de medianoche UTC",()=>{
 assert.equal(dates.operationalDate("2026-09-10T01:30:00Z"),"2026-09-09");
 assert.equal(dates.operationalDate("2026-09-10T03:00:00Z"),"2026-09-10");
});
test("Una venta de importe cero conserva la pérdida y el stock no genera ganancia",()=>{
 const sold={state:"ENTREGADA",sale:0,cost:12.05,commission:1};
 assert.equal(analytics.metricValue(sold,"profit"),-13.05);
 assert.equal(analytics.metricValue({...sold,state:"STOCK"},"profit"),0);
});
test("Los meses se ordenan cronológicamente y los filtros no mezclan estados",()=>{
 const config={dimension:"month",metric:"sales",state:"ENTREGADA"};
 const rows=[{date:"2026-09-09",state:"ENTREGADA",sale:50},{date:"2026-08-31",state:"ENTREGADA",sale:10},{date:"2026-09-08",state:"REPARTO",sale:80}];
 assert.deepEqual(analytics.aggregate(rows,config),[{label:"2026-08",value:10},{label:"2026-09",value:50}]);
});
test("Las líneas reales y el envío forman los totales de compra y venta",()=>{
 const raw={
  products:[{id:1,nombre:"Equipo",marca:"Marca",categoria:"Celulares"}],suppliers:[{id:2,nombre:"Proveedor"}],clients:[{id:3,nombre:"Cliente"}],sellers:[{id:4,nombre:"Vendedor"}],
  orders:[{id:5,proveedor_id:2,fecha_pedido:"2026-09-09T03:00:00Z",fecha_estimada:"2026-09-09",estado:"RECIBIDO",costo_envio_usd:0.05,cerrado_en:null}],
  lines:[{id:6,pedido_id:5,producto_id:1,color:"Negro",cantidad:2,precio_costo_usd:10},{id:7,pedido_id:5,producto_id:1,color:"Blanco",cantidad:1,precio_costo_usd:20}],
  units:[{id:8,pedido_id:5,producto_id:1,cliente_id:3,vendedor_id:4,estado:"ENTREGADA",color:"Negro",precio_costo_usd:10,costo_envio_usd:0.02,fecha_ingreso_stock:"2026-09-09T12:00:00Z",fecha_venta:"2026-09-09T03:00:00Z",fecha_entrega:"2026-09-10T14:00:00Z",precio_venta_usd:30,comision_usd:1.5,pago_verificado:true}],
  charts:[]
 };
 const result=operations.deriveOperations(raw);
 assert.equal(result.orders[0].units,3);
 assert.equal(result.orders[0].merchandiseUsd,40);
 assert.equal(result.sales[0].costUsd,10.02);
 assert.equal(result.sales[0].date,"2026-09-09");
 assert.equal(result.sales[0].deliveredAt,"2026-09-10T14:00:00Z");
 assert.equal(result.analytics[0].cost,10.02);
});
