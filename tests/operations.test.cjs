const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
function load(file,deps={}) {
 const output=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};new Function("require","exports",output)(name=>{if(name in deps)return deps[name];throw Error("Unexpected import: "+name);},exports);return exports;
}
const dates=load("lib/dates.ts");
const operations=load("lib/operations.ts",{"./dates":dates, "./purchase-details":load("lib/purchase-details.ts")});
test("La fecha operativa usa Buenos Aires incluso después de medianoche UTC",()=>{
 assert.equal(dates.operationalDate("2026-09-10T01:30:00Z"),"2026-09-09");
 assert.equal(dates.operationalDate("2026-09-10T03:00:00Z"),"2026-09-10");
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
 assert.equal(result.stock[0].costUsd,10.02);
 // Una venta de importe cero conserva el costo y la comisión históricos.
 raw.units[0].precio_venta_usd=0;
 const sale=operations.deriveOperations(raw).sales[0];
 assert.equal(sale.priceUsd-sale.costUsd-sale.commissionUsd,-11.52);
 raw.units[0].estado="STOCK";
 assert.equal(operations.deriveOperations(raw).sales.length,0);
});

test("Abonos suman centavos y el saldo alpha no inventa historial",()=>{
 const raw={products:[],suppliers:[],clients:[],sellers:[],orders:[],lines:[],charts:[],units:[{id:1,estado:"ENTREGADA",fecha_venta:"2026-09-13",fecha_ingreso_stock:"2026-09-13",precio_venta_usd:100,pago_verificado:true}]};
 let sale=operations.deriveOperations(raw).sales[0];
 assert.equal(sale.openingPaidUsd,100);assert.equal(sale.pendingUsd,0);assert.deepEqual(sale.payments,[]);
 raw.units[0].cobrado_inicial_usd=0;raw.units[0].pago_verificado=false;raw.salePayments=[];
 for(const [amount,pending] of [[40,60],[40,20],[20,0]]) {
  raw.salePayments.push({unidad_id:1,importe_usd:amount});sale=operations.deriveOperations(raw).sales[0];
  assert.equal(sale.pendingUsd,pending);assert.equal(sale.paidUsd,100-pending);
 }
 raw.units[0].precio_venta_usd=0.3;raw.salePayments=[{unidad_id:1,importe_usd:0.1},{unidad_id:1,importe_usd:0.2},{unidad_id:99,importe_usd:90}];
 sale=operations.deriveOperations(raw).sales[0];assert.equal(sale.pendingUsd,0);assert.equal(sale.paidUsd,0.3);
});
