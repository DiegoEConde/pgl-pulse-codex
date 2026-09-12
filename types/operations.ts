import type { Tables } from "@/lib/supabase/types";
export type PurchaseStatus = "BORRADOR" | "PEDIDO" | "ENVÍO" | "RECIBIDO";
export type PurchaseLine = Tables<"detalle_pedido"> & { product: string; ram: string; rom: string };
export type PurchaseOrder = {
  id: number; supplier: string; date: string; expectedDate: string; units: number;
  receivedUnits: number; status: PurchaseStatus; products: string[]; merchandiseUsd: number;
  shippingUsd: number; notes?: string; closed: boolean; lines: PurchaseLine[];
};
export type SaleStatus = "REPARTO" | "ENTREGADA";
export type Sale = {
  id: number; unitId: string; product: string; code: string; client: string; seller: string;
  clientId: number; date: string; priceUsd: number; costUsd: number; commissionUsd: number;
  paid: boolean; status: SaleStatus; deliveredAt: string | null;
};
export type StockUnit = {
  id: string; databaseId: number; product: string; brand: string; category: string;
  variant: string; ram: string; color: string; code: string; purchaseOrder: number;
  supplier: string; receivedAt: string; costUsd: number; salePriceUsd: number | null;
  state: string;
};
// Contrato de pgl_snapshot; charts se conserva por compatibilidad con la base existente.
export type Snapshot = {
  products: Tables<"producto">[]; suppliers: Tables<"proveedor">[]; clients: Tables<"cliente">[];
  sellers: Tables<"vendedor">[]; orders: Tables<"pedido">[]; lines: Tables<"detalle_pedido">[];
  units: Tables<"unidad">[]; charts: Tables<"reporte_config">[];
};
