import type { Snapshot, PurchaseOrder, PurchaseStatus, Sale, StockUnit } from "@/types/operations";
import type { AnalyticsRow } from "@/types/analytics";
import { operationalDate } from "./dates";

export function deriveOperations(data: Snapshot) {
  const products = new Map(data.products.map(row => [row.id, row]));
  const suppliers = new Map(data.suppliers.map(row => [row.id, row]));
  const clients = new Map(data.clients.map(row => [row.id, row]));
  const sellers = new Map(data.sellers.map(row => [row.id, row]));
  const ordersById = new Map(data.orders.map(row => [row.id, row]));
  const orders: PurchaseOrder[] = data.orders.map(order => {
    const lines = data.lines.filter(line => line.pedido_id === order.id).map(line => ({ ...line, product: products.get(line.producto_id)?.nombre ?? "Producto no disponible" }));
    return { id: order.id, supplier: suppliers.get(order.proveedor_id)?.nombre ?? "—",
      date: order.fecha_pedido ? operationalDate(order.fecha_pedido) : "", expectedDate: order.fecha_estimada ?? "",
      units: lines.reduce((total, line) => total + line.cantidad, 0),
      receivedUnits: data.units.filter(unit => unit.pedido_id === order.id).length,
      status: order.estado as PurchaseStatus, products: lines.map(line => line.product),
      merchandiseUsd: lines.reduce((total, line) => total + line.cantidad * line.precio_costo_usd, 0),
      shippingUsd: order.costo_envio_usd, notes: order.observaciones ?? undefined, closed: Boolean(order.cerrado_en), lines };
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const stock: StockUnit[] = data.units.map(unit => {
    const product = products.get(unit.producto_id);
    const order = ordersById.get(unit.pedido_id);
    return { id: "U-" + unit.id, databaseId: unit.id, product: product?.nombre ?? "—", brand: product?.marca ?? "—",
      category: product?.categoria ?? "—", variant: unit.variante ?? "", ram: unit.ram ?? "", color: unit.color,
      code: unit.codigo ?? "", purchaseOrder: unit.pedido_id, supplier: suppliers.get(order?.proveedor_id ?? 0)?.nombre ?? "—",
      receivedAt: operationalDate(unit.fecha_ingreso_stock), costUsd: unit.precio_costo_usd + unit.costo_envio_usd,
      salePriceUsd: unit.precio_sugerido_usd, state: unit.estado };
  });
  const sales: Sale[] = data.units.filter(unit => unit.fecha_venta && (unit.estado === "REPARTO" || unit.estado === "ENTREGADA")).map(unit => ({
    id: unit.id, unitId: "U-" + unit.id, product: products.get(unit.producto_id)?.nombre ?? "—", code: unit.codigo ?? "",
    client: clients.get(unit.cliente_id ?? 0)?.nombre ?? "—", clientId: unit.cliente_id ?? 0,
    seller: sellers.get(unit.vendedor_id ?? 0)?.nombre ?? "—", date: operationalDate(unit.fecha_venta!),
    priceUsd: unit.precio_venta_usd ?? 0, costUsd: unit.precio_costo_usd + unit.costo_envio_usd,
    commissionUsd: unit.comision_usd ?? 0, paid: unit.pago_verificado,
    status: unit.estado as Sale["status"], deliveredAt: unit.fecha_entrega,
  })).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const analytics: AnalyticsRow[] = data.units.map(unit => {
    const product = products.get(unit.producto_id);
    const order = ordersById.get(unit.pedido_id);
    return { id: "U-" + unit.id, date: operationalDate(unit.fecha_venta ?? unit.fecha_ingreso_stock), state: unit.estado,
      product: product?.nombre ?? "—", brand: product?.marca ?? "—", category: product?.categoria ?? "—",
      supplier: suppliers.get(order?.proveedor_id ?? 0)?.nombre ?? "—",
      client: clients.get(unit.cliente_id ?? 0)?.nombre ?? "—", seller: sellers.get(unit.vendedor_id ?? 0)?.nombre ?? "—",
      cost: unit.precio_costo_usd + unit.costo_envio_usd, sale: unit.precio_venta_usd ?? 0,
      commission: unit.comision_usd ?? 0, paid: unit.pago_verificado };
  });
  return { orders, stock, sales, analytics };
}
