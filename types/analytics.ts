export type ChartType = "bar" | "line" | "donut";
export type Dimension = "state" | "product" | "brand" | "category" | "seller" | "supplier" | "month";
export type Metric = "units" | "sales" | "profit" | "cost" | "commissions";
export type ReportConfig = { id: string; title: string; dimension: Dimension; metric: Metric; chartType: ChartType; state: string };
export type AnalyticsRow = { id: string; date: string; state: string; product: string; brand: string; category: string; supplier: string; client: string; seller: string; cost: number; sale: number; commission: number; paid: boolean };
export type ChartDatum = { label: string; value: number };
