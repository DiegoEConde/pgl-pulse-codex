export type PurchaseStatus = "BORRADOR" | "PEDIDO" | "ENVÍO" | "RECIBIDO";

export type PurchaseOrder = {
  id: number;
  supplier: string;
  date: string;
  expectedDate: string;
  units: number;
  receivedUnits: number;
  status: PurchaseStatus;
  products: string[];
  merchandiseUsd: number;
  shippingUsd: number;
  notes?: string;
};

export const purchaseOrdersMock: PurchaseOrder[] = [
  { id: 423, supplier: "Apple Partner BA", date: "2026-08-31", expectedDate: "2026-09-03", units: 3, receivedUnits: 0, status: "PEDIDO", products: ["iPhone 16 Pro"], merchandiseUsd: 3240, shippingUsd: 55 },
  { id: 422, supplier: "Tecno Import", date: "2026-08-31", expectedDate: "2026-09-02", units: 5, receivedUnits: 0, status: "BORRADOR", products: ["AirPods Pro", "GoPro MAX"], merchandiseUsd: 1860, shippingUsd: 70 },
  { id: 421, supplier: "Distribuidor Norte", date: "2026-08-29", expectedDate: "2026-09-02", units: 6, receivedUnits: 0, status: "ENVÍO", products: ["Galaxy S26 Ultra", "Galaxy S25"], merchandiseUsd: 5480, shippingUsd: 90, notes: "Solicitar fotos de series antes del despacho." },
  { id: 420, supplier: "Apple Partner BA", date: "2026-08-28", expectedDate: "2026-08-30", units: 4, receivedUnits: 4, status: "RECIBIDO", products: ["iPhone 16 Pro"], merchandiseUsd: 4320, shippingUsd: 60 },
  { id: 419, supplier: "Tecno Import", date: "2026-08-26", expectedDate: "2026-08-29", units: 9, receivedUnits: 9, status: "RECIBIDO", products: ["GoPro MAX", "AirPods Pro"], merchandiseUsd: 6190, shippingUsd: 110 },
  { id: 418, supplier: "Distribuidor Norte", date: "2026-08-24", expectedDate: "2026-08-27", units: 8, receivedUnits: 8, status: "RECIBIDO", products: ["Galaxy S26 Ultra"], merchandiseUsd: 7740, shippingUsd: 85 },
  { id: 417, supplier: "Mobile Hub", date: "2026-08-23", expectedDate: "2026-09-04", units: 3, receivedUnits: 0, status: "PEDIDO", products: ["iPhone 16"], merchandiseUsd: 2280, shippingUsd: 45 },
];

export const suppliersMock = ["Distribuidor Norte", "Apple Partner BA", "Tecno Import", "Mobile Hub"];
