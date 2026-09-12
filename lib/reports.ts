import type { Snapshot } from "@/types/operations";
import { operationalDate } from "./dates";

export type Period = "today" | "month" | "semester" | "year";
export type PieMode = "products" | "clients" | "suppliers";
export type RankingMode = "products" | "sellers";
export type ReportFilter = { start: string; end: string; scope?: "both" | "purchases" | "sales"; product?: string; supplier?: string; seller?: string; client?: string };
export type Fact = { id: number; date: string; productId: number; product: string; supplierId: number; supplier: string; sellerId: number | null; seller: string; clientId: number | null; client: string; quantity: number; unitCost: number; cost: number; revenue: number; commission: number; profit: number; paid: boolean; state: string };
export type Slice = { id: string; label: string; value: number };
export const periodLabels: Record<Period,string> = { today:"Hoy", month:"Mes", semester:"Semestre", year:"Año" };
export const pieLabels: Record<PieMode,string> = { products:"Unidades", clients:"Clientes", suppliers:"Proveedores" };
// El semestre es móvil: mes elegido y cinco anteriores. El período actual termina hoy.
export function periodRange(period: Period, today: string, selected?: string) {
  const value = selected || (period === "today" ? today : period === "year" ? today.slice(0,4) : today.slice(0,7));
  const year = Number(value.slice(0,4)), month = Number(value.slice(5,7) || 1);
  const iso = (date: Date) => date.toISOString().slice(0,10);
  let start: string, end: string;
  if (period === "today") { start=value; end=value; }
  else if (period === "year") { start=value+"-01-01"; end=value+"-12-31"; }
  else {
    start=iso(new Date(Date.UTC(year, month - 1 - (period === "semester" ? 5 : 0), 1)));
    end=iso(new Date(Date.UTC(year, month, 0)));
  }
  return { start, end: end > today ? today : end };
}
const cents = (value: number) => Math.round(value * 100);
function date(value: string | null) { return value ? value.length === 10 ? value : operationalDate(value) : ""; }
export function reportFacts(raw: Snapshot) {
  const products = new Map(raw.products.map(p => [p.id,p]));
  const suppliers = new Map(raw.suppliers.map(p => [p.id,p]));
  const sellers = new Map(raw.sellers.map(p => [p.id,p]));
  const clients = new Map(raw.clients.map(p => [p.id,p]));
  const orders = new Map(raw.orders.map(p => [p.id,p]));
  const name = (id: number) => { const p=products.get(id); return p ? p.marca + " · " + p.nombre : "Producto no disponible"; };
  const purchases: Fact[] = [];
  for (const order of raw.orders) {
    // Los pedidos confirmados cuentan como compra aunque todavía no se hayan recibido.
    if (!["PEDIDO","ENVÍO","RECIBIDO"].includes(order.estado)) continue;
    const lines = raw.lines.filter(l => l.pedido_id === order.id).sort((a,b)=>a.id-b.id);
    const quantity = lines.reduce((s,l)=>s+l.cantidad,0);
    let offset = 0;
    for (const line of lines) {
      const shipping = cents(order.costo_envio_usd);
      const base = quantity ? Math.floor(shipping / quantity) : 0;
      const remainder = quantity ? shipping % quantity : 0;
      // Distribuye los centavos sobrantes por orden de línea y conserva el envío total.
      const allocated = base * line.cantidad + Math.max(0, Math.min(line.cantidad, remainder - offset));
      offset += line.cantidad;
      purchases.push({ id:line.id,date:date(order.fecha_pedido),productId:line.producto_id,product:name(line.producto_id),supplierId:order.proveedor_id,supplier:suppliers.get(order.proveedor_id)?.nombre ?? "Sin proveedor",sellerId:null,seller:"",clientId:null,client:"",quantity:line.cantidad,unitCost:line.precio_costo_usd,cost:(cents(line.precio_costo_usd)*line.cantidad+allocated)/100,revenue:0,commission:0,profit:0,paid:false,state:order.estado });
    }
  }
  // La ganancia usa el costo y la comisión de la unidad vendida, no las compras del período.
  const sales: Fact[] = raw.units.filter(u => u.fecha_venta && ["REPARTO","ENTREGADA"].includes(u.estado)).map(u => {
    const order = orders.get(u.pedido_id);
    const revenue = cents(u.precio_venta_usd ?? 0), cost=cents(u.precio_costo_usd)+cents(u.costo_envio_usd),commission=cents(u.comision_usd ?? 0);
    return {id:u.id,date:date(u.fecha_venta),productId:u.producto_id,product:name(u.producto_id),supplierId:order?.proveedor_id ?? 0,supplier:suppliers.get(order?.proveedor_id ?? 0)?.nombre ?? "Sin proveedor",sellerId:u.vendedor_id,seller:sellers.get(u.vendedor_id ?? 0)?.nombre ?? "Sin vendedor",clientId:u.cliente_id,client:clients.get(u.cliente_id ?? 0)?.nombre ?? "Sin cliente",quantity:1,unitCost:u.precio_costo_usd,cost:cost/100,revenue:revenue/100,commission:commission/100,profit:(revenue-cost-commission)/100,paid:u.pago_verificado,state:u.estado};
  });
  return { purchases, sales };
}
export function makeReport(facts: ReturnType<typeof reportFacts>, filter: ReportFilter) {
  const matches = (r: Fact) => r.date !== "" && r.date >= filter.start && r.date <= filter.end && (!filter.product || String(r.productId)===filter.product) && (!filter.supplier || String(r.supplierId)===filter.supplier);
  const purchases = filter.scope === "sales" ? [] : facts.purchases.filter(matches);
  const sales = filter.scope === "purchases" ? [] : facts.sales.filter(r=>matches(r) && (!filter.seller || String(r.sellerId)===filter.seller) && (!filter.client || String(r.clientId)===filter.client));
  const sum = (rows: Fact[],key:"cost"|"revenue"|"profit"|"commission") => rows.reduce((s,r)=>s+cents(r[key]),0)/100;
  return { purchases,sales,filter,cost:sum(purchases,"cost"),units:purchases.reduce((s,r)=>s+r.quantity,0),revenue:sum(sales,"revenue"),profit:sum(sales,"profit"),commission:sum(sales,"commission"),soldCost:sum(sales,"cost"),soldUnits:sales.length,paid:sales.filter(r=>r.paid).length };
}
export type Report = ReturnType<typeof makeReport>;
export function reportSlices(report: Report, mode: PieMode, top = false): Slice[] {
  // Agrupa por ID: dos clientes o proveedores pueden tener el mismo nombre.
  const grouped = new Map<string,Slice>();
  for (const row of mode === "clients" ? report.sales : report.purchases) {
    const id=String(mode==="products"?row.productId:mode==="clients"?row.clientId:row.supplierId);
    const label=mode==="products"?row.product:mode==="clients"?row.client:row.supplier;
    const entry=grouped.get(id) ?? {id,label,value:0};entry.value+=row.quantity;grouped.set(id,entry);
  }
  const result=[...grouped.values()].sort((a,b)=>b.value-a.value || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  return top ? result.slice(0,10) : result;
}
export function expensiveProducts(report: Report) {
  const grouped = new Map<number,Fact>();
  for(const row of report.purchases) if (!grouped.has(row.productId) || grouped.get(row.productId)!.unitCost < row.unitCost) grouped.set(row.productId,row);
  return [...grouped.values()].sort((a,b)=>b.unitCost-a.unitCost || a.product.localeCompare(b.product)).slice(0,5);
}
export function productiveSellers(report: Report) {
  const grouped=new Map<number|null,{id:number|null;name:string;profit:number;revenue:number;commission:number;units:number}>();
  for(const row of report.sales) {const entry=grouped.get(row.sellerId) ?? {id:row.sellerId,name:row.seller,profit:0,revenue:0,commission:0,units:0};entry.profit+=cents(row.profit);entry.revenue+=cents(row.revenue);entry.commission+=cents(row.commission);entry.units++;grouped.set(row.sellerId,entry);}
  return [...grouped.values()].map(r=>({...r,profit:r.profit/100,revenue:r.revenue/100,commission:r.commission/100})).sort((a,b)=>b.profit-a.profit || b.revenue-a.revenue || a.name.localeCompare(b.name)).slice(0,5);
}
