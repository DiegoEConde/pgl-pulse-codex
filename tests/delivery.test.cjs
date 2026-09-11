const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file, deps = {}) {
 const output = ts.transpileModule(fs.readFileSync(file,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
 const exports = {}; new Function("require","exports",output)(name => { if (name in deps) return deps[name]; throw Error(name); },exports); return exports;
}
const details = load("lib/purchase-details.ts");
const {buildDeliveryGroups: groups} = load("lib/delivery.ts", {"./purchase-details":details});
const {deriveOperations} = load("lib/operations.ts", {"./purchase-details":details,"./dates":load("lib/dates.ts")});
function fixture() { return {products:[{id:1,marca:"Apple",nombre:"iPhone 15"}],suppliers:[
{id:1,nombre:"Jacinto",horario_desde:"15:00:00",horario_hasta:"16:00:00"},
{id:2,nombre:"Roman",horario_desde:"14:00:00",horario_hasta:"16:00:00"},
{id:3,nombre:"Anselmo",horario_desde:"10:00:00",horario_hasta:"20:00:00"}],
orders:[],lines:[],units:[],clients:[],sellers:[],charts:[]}; }
function add(raw,id,supplier,extra={}) {
 raw.orders.push({id,proveedor_id:supplier,estado:"BORRADOR",cerrado_en:null,...extra});
 raw.lines.push({id,pedido_id:id,producto_id:1,color:"Negro",cantidad:1,precio_costo_usd:450});
}
test("Un pedido crea tarjeta; otro del mismo proveedor agrega una linea sin duplicarla",()=>{
 const raw=fixture(); assert.deepEqual(groups(raw),[]); add(raw,1,1); assert.equal(groups(raw).length,1);
 add(raw,2,1); const result=groups(raw); assert.equal(result.length,1); assert.deepEqual(result[0].lines.map(x=>x.orderId),[1,2]);
});
test("Inserciones sucesivas reordenan por inicio: Anselmo, Roman, Jacinto",()=>{
 const raw=fixture(); add(raw,1,1); add(raw,2,2); assert.deepEqual(groups(raw).map(x=>x.name),["Roman","Jacinto"]);
 add(raw,3,3); assert.deepEqual(groups(raw).map(x=>x.name),["Anselmo","Roman","Jacinto"]);
 const before=JSON.stringify(raw); groups(raw); assert.equal(JSON.stringify(raw),before);
});
test("Horarios solapados no se fusionan y los proveedores sin horario quedan al final",()=>{
 const raw=fixture(); raw.suppliers.push({id:4,nombre:"Sin horario"}); add(raw,1,4);add(raw,2,1);add(raw,3,2);
 assert.deepEqual(groups(raw).map(x=>x.name),["Roman","Jacinto","Sin horario"]);
});
test("Agrupa por ID aun con nombres iguales y desempata por nombre e ID",()=>{
 const raw=fixture();raw.suppliers[1].nombre="Jacinto";raw.suppliers[1].horario_desde="15:00:00";add(raw,1,2);add(raw,2,1);
 assert.deepEqual(groups(raw).map(x=>x.supplierId),[1,2]);
});
test("Recibidos y cerrados desaparecen; borradores y pendientes de otros dias permanecen",()=>{
 const raw=fixture();add(raw,1,1,{estado:"RECIBIDO"});add(raw,2,2,{cerrado_en:"2026-09-11"});add(raw,3,3,{estado:"ENVÍO",fecha_estimada:"2026-09-09"});
 assert.deepEqual(groups(raw).map(x=>x.name),["Anselmo"]);
});
test("RAM/ROM, notas, cantidades y costo sobreviven al snapshot y a la derivacion",()=>{
 const raw=fixture();const notes=details.encodePurchaseDetails("Llamar antes",[{producto_id:1,color:"Negro",ram:"12",rom:"128"}]);
 add(raw,1,1,{observaciones:notes});raw.lines[0].cantidad=3;raw.lines[0].precio_costo_usd=450.25;
 const line=groups(JSON.parse(JSON.stringify(raw)))[0].lines[0];assert.equal(line.ram,"12");assert.equal(line.rom,"128");assert.equal(line.cost,450.25);assert.equal(line.quantity,3);
 const derived=deriveOperations(raw).orders[0];assert.equal(derived.notes,"Llamar antes");assert.equal(derived.lines[0].ram,"12");assert.equal(derived.lines[0].rom,"128");
});
test("RAM/ROM no se mezcla entre pedidos ni colores del mismo modelo",()=>{
 const raw=fixture();add(raw,1,1,{observaciones:details.encodePurchaseDetails("",[{producto_id:1,color:"Negro",ram:"8",rom:"256"}])});
 add(raw,2,1,{observaciones:details.encodePurchaseDetails("",[{producto_id:1,color:"Negro",ram:"12",rom:"128"}])});
 raw.lines.push({id:3,pedido_id:1,producto_id:1,color:"Azul",cantidad:1,precio_costo_usd:0});
 assert.deepEqual(groups(raw)[0].lines.map(x=>[x.ram,x.rom]),[["8","256"],["",""],["12","128"]]);
});
test("Notas antiguas o JSON ajeno/invalido se conservan y no inventan memoria",()=>{
 for(const value of ["Nota normal","{","null",'{"format":"pgl.purchase-details.v1","notes":"x","lines":[{}]}']) assert.deepEqual(details.decodePurchaseDetails(value),{notes:value,lines:[]});
 assert.equal(details.encodePurchaseDetails("Texto",[]),"Texto");
});

const {formatDeliveryMessage: message}=load("lib/delivery.ts",{"./purchase-details":details});
test("Formato WhatsApp exacto con asteriscos, cantidades, colores y total por proveedor",()=>{
 const group={name:"Roman",address:"Calle X 1111",from:"14:00",until:"16:00",lines:[
 {product:"Samsung · A16",ram:"4",rom:"128",quantity:2,cost:155,color:"Black"},
 {product:"Samsung · A17",ram:"4",rom:"128",quantity:1,cost:170,color:"Black"},
 {product:"Samsung · A17",ram:"4",rom:"128",quantity:1,cost:170,color:"Gray"}]};
 assert.equal(message([group]),"*ROMAN - Calle X 1111*\nde 14 a 16\n\n(2) SAMSUNG A16 4/128 GB - $ 155\nBLACK\n\n(1) SAMSUNG A17 4/128 GB - $ 170\nBLACK\n\n(1) SAMSUNG A17 4/128 GB - $ 170\nGRAY\n\n*(TOTAL: USD 650)*");
 assert.equal(message([group, {...group,name:"Anselmo"}]).split("\n\n---\n\n").length,2);
});
test("Exporta todas las lineas en el orden recibido, conserva minutos y calcula centavos",()=>{
 const raw=fixture();add(raw,1,1);add(raw,2,2);add(raw,3,3);
 raw.suppliers[2].horario_desde="10:30:00";raw.lines[2].cantidad=3;raw.lines[2].precio_costo_usd=0.1;
 const text=message(groups(raw));assert.ok(text.indexOf("*ANSELMO")<text.indexOf("*ROMAN"));assert.ok(text.includes("de 10:30 a 20"));assert.ok(text.includes("*(TOTAL: USD 0.30)*"));assert.equal(message([]),"");
});
