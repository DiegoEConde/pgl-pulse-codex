import type { AnalyticsRow, ChartDatum, Dimension, Metric, ReportConfig } from "@/types/analytics";

export const dimensionLabels: Record<Dimension,string> = { state:"Estado",product:"Producto",brand:"Marca",category:"Categoría",seller:"Vendedor",supplier:"Proveedor",month:"Mes" };
export const metricLabels: Record<Metric,string> = { units:"Unidades",sales:"Ventas",profit:"Ganancia",cost:"Costo",commissions:"Comisiones" };

export function filterAnalytics(rows: AnalyticsRow[], config: ReportConfig) {
  return rows.filter((row) => config.state === "TODOS" || row.state === config.state);
}
export function metricValue(row: AnalyticsRow, metric: Metric) {
  if (metric === "units") return 1;
  if (metric === "sales") return row.sale;
  if (metric === "cost") return row.cost;
  if (metric === "commissions") return row.commission;
  return row.sale ? row.sale - row.cost - row.commission : 0;
}
export function aggregate(rows: AnalyticsRow[], config: ReportConfig): ChartDatum[] {
  const grouped = new Map<string,number>();
  filterAnalytics(rows,config).forEach((row) => {
    const label = config.dimension === "month" ? row.date.slice(0,7) : String(row[config.dimension] || "Sin asignar");
    grouped.set(label,(grouped.get(label) ?? 0) + metricValue(row,config.metric));
  });
  return [...grouped].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
export function formatMetric(value:number, metric:Metric) {
  return metric === "units" ? String(value) : new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
}
