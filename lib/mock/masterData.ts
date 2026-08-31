export type CatalogId = "products" | "suppliers" | "clients" | "sellers";
export type MasterRecord = { id: number; title: string; subtitle: string; meta: string; active: boolean };

export const masterDataMock: Record<CatalogId, MasterRecord[]> = {
  products: [
    { id: 1, title: "iPhone 16 Pro", subtitle: "Apple · Celulares", meta: "256 GB", active: true },
    { id: 2, title: "Galaxy S26 Ultra", subtitle: "Samsung · Celulares", meta: "512 GB", active: true },
    { id: 3, title: "GoPro MAX", subtitle: "GoPro · Cámaras", meta: "Standard", active: true },
    { id: 4, title: "AirPods Pro", subtitle: "Apple · Audio", meta: "USB-C", active: true },
  ],
  suppliers: [
    { id: 1, title: "Distribuidor Norte", subtitle: "ventas@distnorte.com", meta: "+54 11 4555-0184", active: true },
    { id: 2, title: "Apple Partner BA", subtitle: "pedidos@apba.com", meta: "+54 11 4771-9050", active: true },
    { id: 3, title: "Tecno Import", subtitle: "compras@tecnoimport.com", meta: "+54 11 3220-1442", active: true },
    { id: 4, title: "Mobile Hub", subtitle: "operaciones@mobilehub.com", meta: "+54 11 6120-0880", active: false },
  ],
  clients: [
    { id: 1, title: "Carla Sosa", subtitle: "carla.sosa@email.com", meta: "+54 9 11 5501-2203", active: true },
    { id: 2, title: "Nicolás Ferrer", subtitle: "nicolas.f@email.com", meta: "+54 9 11 4031-9910", active: true },
    { id: 3, title: "Matías Ríos", subtitle: "matias.rios@email.com", meta: "+54 9 11 6208-1134", active: true },
    { id: 4, title: "Martina Acosta", subtitle: "martina.a@email.com", meta: "+54 9 11 3381-7210", active: true },
  ],
  sellers: [
    { id: 1, title: "Diego", subtitle: "Vendedor principal", meta: "5% comisión", active: true },
    { id: 2, title: "Lucía", subtitle: "Ventas y reparto", meta: "5% comisión", active: true },
    { id: 3, title: "Santiago", subtitle: "Vendedor", meta: "4% comisión", active: true },
  ],
};

export const catalogConfig = {
  products: { label: "Productos", singular: "Producto", description: "Modelos comerciales utilizados por las Unidades.", fields: ["Nombre", "Marca / categoría", "Variante"] },
  suppliers: { label: "Proveedores", singular: "Proveedor", description: "Contactos comerciales para pedidos de compra.", fields: ["Razón social", "Email", "Teléfono"] },
  clients: { label: "Clientes", singular: "Cliente", description: "Personas asociadas a ventas y entregas.", fields: ["Nombre completo", "Email", "Teléfono"] },
  sellers: { label: "Vendedores", singular: "Vendedor", description: "Responsables comerciales y reglas de comisión.", fields: ["Nombre", "Rol", "Comisión"] },
} satisfies Record<CatalogId, { label: string; singular: string; description: string; fields: [string, string, string] }>;
