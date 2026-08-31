export type StockUnit = {
  id: string;
  product: string;
  brand: string;
  category: string;
  variant: string;
  color: string;
  code: string;
  purchaseOrder: number;
  supplier: string;
  receivedAt: string;
  costUsd: number;
  salePriceUsd: number;
  state: "RETIRADO" | "STOCK" | "REPARTO" | "ENTREGADA";
};

export const stockMock: StockUnit[] = [
  { id: "U-1048", product: "iPhone 16 Pro", brand: "Apple", category: "Celulares", variant: "256 GB", color: "Titanio natural", code: "356821•••904", purchaseOrder: 420, supplier: "Apple Partner BA", receivedAt: "2026-08-30", costUsd: 1080, salePriceUsd: 1320 },
  { id: "U-1046", product: "GoPro MAX", brand: "GoPro", category: "Cámaras", variant: "Standard", color: "Negro", code: "GP-MX-00931", purchaseOrder: 419, supplier: "Tecno Import", receivedAt: "2026-08-29", costUsd: 420, salePriceUsd: 540 },
  { id: "U-1039", product: "Galaxy S25", brand: "Samsung", category: "Celulares", variant: "256 GB", color: "Azul", code: "352511•••821", purchaseOrder: 418, supplier: "Distribuidor Norte", receivedAt: "2026-08-27", costUsd: 610, salePriceUsd: 790 },
  { id: "U-1038", product: "Galaxy S25", brand: "Samsung", category: "Celulares", variant: "256 GB", color: "Negro", code: "352511•••779", purchaseOrder: 418, supplier: "Distribuidor Norte", receivedAt: "2026-08-27", costUsd: 610, salePriceUsd: 790 },
  { id: "U-1037", product: "AirPods Pro", brand: "Apple", category: "Audio", variant: "USB-C", color: "Blanco", code: "AP-PRO-7641", purchaseOrder: 419, supplier: "Tecno Import", receivedAt: "2026-08-29", costUsd: 180, salePriceUsd: 245 },
  { id: "U-1036", product: "iPhone 16", brand: "Apple", category: "Celulares", variant: "128 GB", color: "Negro", code: "351180•••530", purchaseOrder: 417, supplier: "Mobile Hub", receivedAt: "2026-08-26", costUsd: 760, salePriceUsd: 960 },
  { id: "U-1035", product: "GoPro MAX", brand: "GoPro", category: "Cámaras", variant: "Standard", color: "Negro", code: "GP-MX-00892", purchaseOrder: 419, supplier: "Tecno Import", receivedAt: "2026-08-29", costUsd: 420, salePriceUsd: 540 },
].map((unit) => ({ ...unit, state: "STOCK" as const }));
