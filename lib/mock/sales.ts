export type SaleStatus = "PENDIENTE" | "PREPARANDO" | "EN_REPARTO" | "ENTREGADA";

export type Sale = {
  id: number;
  unitId: string;
  product: string;
  code: string;
  client: string;
  seller: string;
  date: string;
  priceUsd: number;
  costUsd: number;
  commissionUsd: number;
  paid: boolean;
  status: SaleStatus;
};

export type StockUnit = { id: string; product: string; variant: string; code: string; costUsd: number; suggestedPriceUsd: number };

export const salesMock: Sale[] = [
  { id: 1086, unitId: "U-1045", product: "AirPods Pro", code: "AP-PRO-7712", client: "Carla Sosa", seller: "Diego", date: "2026-08-31", priceUsd: 245, costUsd: 180, commissionUsd: 12, paid: true, status: "ENTREGADA" },
  { id: 1085, unitId: "U-1044", product: "iPhone 16", code: "351180•••672", client: "Nicolás Ferrer", seller: "Lucía", date: "2026-08-31", priceUsd: 960, costUsd: 760, commissionUsd: 48, paid: true, status: "EN_REPARTO" },
  { id: 1084, unitId: "U-1042", product: "Galaxy S26 Ultra", code: "358940•••118", client: "Matías Ríos", seller: "Lucía", date: "2026-08-31", priceUsd: 1190, costUsd: 940, commissionUsd: 59.5, paid: true, status: "PREPARANDO" },
  { id: 1083, unitId: "U-1041", product: "GoPro MAX", code: "GP-MX-00872", client: "Federico Luna", seller: "Diego", date: "2026-08-30", priceUsd: 540, costUsd: 420, commissionUsd: 27, paid: false, status: "PENDIENTE" },
];

export const stockUnitsMock: StockUnit[] = [
  { id: "U-1048", product: "iPhone 16 Pro", variant: "256 GB · Titanio natural", code: "356821•••904", costUsd: 1080, suggestedPriceUsd: 1320 },
  { id: "U-1046", product: "GoPro MAX", variant: "Negro", code: "GP-MX-00931", costUsd: 420, suggestedPriceUsd: 540 },
  { id: "U-1039", product: "Galaxy S25", variant: "256 GB · Azul", code: "352511•••821", costUsd: 610, suggestedPriceUsd: 790 },
];

export const clientsMock = ["Carla Sosa", "Nicolás Ferrer", "Matías Ríos", "Federico Luna", "Martina Acosta"];
export const sellersMock = ["Diego", "Lucía", "Santiago"];
