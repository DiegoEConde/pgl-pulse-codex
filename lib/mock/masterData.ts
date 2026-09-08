// Source: ../pgl-pulse/docs/database.sql v1.0, checked against lib/supabase/types.ts.
// Demonstration records only; missing optional data remains null.
export type CatalogId = "products" | "suppliers" | "clients" | "sellers";
export type MasterRecord = { id: number; nombre: string; [key: string]: string | number | null };
export type CatalogField = { key: string; label: string; type?: "text" | "tel" | "time" | "number" | "textarea"; required?: boolean; maxLength?: number };
export type CatalogConfig = { label: string; singular: string; table: string; description: string; fields: CatalogField[] };
export const masterDataMock: Record<CatalogId, MasterRecord[]> = {
  "products": [
    {
      "id": 1,
      "marca": "Apple",
      "nombre": "iPhone 16 Pro",
      "categoria": "Celulares"
    },
    {
      "id": 2,
      "marca": "Samsung",
      "nombre": "Galaxy S26 Ultra",
      "categoria": "Celulares"
    },
    {
      "id": 3,
      "marca": "GoPro",
      "nombre": "GoPro MAX",
      "categoria": "Cámaras"
    },
    {
      "id": 4,
      "marca": "Apple",
      "nombre": "AirPods Pro",
      "categoria": "Audio"
    }
  ],
  "suppliers": [
    {
      "id": 1,
      "nombre": "Distribuidor Norte",
      "contacto": null,
      "telefono": "+54 11 4555-0184",
      "direccion": null,
      "horario_desde": null,
      "horario_hasta": null,
      "observaciones": null
    },
    {
      "id": 2,
      "nombre": "Apple Partner BA",
      "contacto": null,
      "telefono": "+54 11 4771-9050",
      "direccion": null,
      "horario_desde": null,
      "horario_hasta": null,
      "observaciones": null
    },
    {
      "id": 3,
      "nombre": "Tecno Import",
      "contacto": null,
      "telefono": "+54 11 3220-1442",
      "direccion": null,
      "horario_desde": null,
      "horario_hasta": null,
      "observaciones": null
    },
    {
      "id": 4,
      "nombre": "Mobile Hub",
      "contacto": null,
      "telefono": "+54 11 6120-0880",
      "direccion": null,
      "horario_desde": null,
      "horario_hasta": null,
      "observaciones": null
    }
  ],
  "clients": [
    {
      "id": 1,
      "nombre": "Carla Sosa",
      "telefono": "+54 9 11 5501-2203",
      "direccion": null,
      "localidad": null,
      "observaciones": null
    },
    {
      "id": 2,
      "nombre": "Nicolás Ferrer",
      "telefono": "+54 9 11 4031-9910",
      "direccion": null,
      "localidad": null,
      "observaciones": null
    },
    {
      "id": 3,
      "nombre": "Matías Ríos",
      "telefono": "+54 9 11 6208-1134",
      "direccion": null,
      "localidad": null,
      "observaciones": null
    },
    {
      "id": 4,
      "nombre": "Martina Acosta",
      "telefono": "+54 9 11 3381-7210",
      "direccion": null,
      "localidad": null,
      "observaciones": null
    }
  ],
  "sellers": [
    {
      "id": 1,
      "nombre": "Diego",
      "telefono": null,
      "porcentaje_comision": 5,
      "observaciones": null
    },
    {
      "id": 2,
      "nombre": "Lucía",
      "telefono": null,
      "porcentaje_comision": 5,
      "observaciones": null
    },
    {
      "id": 3,
      "nombre": "Santiago",
      "telefono": null,
      "porcentaje_comision": 4,
      "observaciones": null
    }
  ]
};
export const catalogConfig: Record<CatalogId, CatalogConfig> = {
  "products": {
    "label": "Productos",
    "singular": "Producto",
    "table": "producto",
    "description": "Modelos, marcas y categorías.",
    "fields": [
      {
        "key": "marca",
        "label": "Marca",
        "required": true,
        "maxLength": 80
      },
      {
        "key": "nombre",
        "label": "Nombre",
        "required": true,
        "maxLength": 150
      },
      {
        "key": "categoria",
        "label": "Categoría",
        "required": true,
        "maxLength": 80
      }
    ]
  },
  "suppliers": {
    "label": "Proveedores",
    "singular": "Proveedor",
    "table": "proveedor",
    "description": "Contactos, direcciones y horarios de proveedores.",
    "fields": [
      {
        "key": "nombre",
        "label": "Nombre",
        "required": true,
        "maxLength": 120
      },
      {
        "key": "contacto",
        "label": "Contacto",
        "maxLength": 120
      },
      {
        "key": "telefono",
        "label": "Teléfono",
        "type": "tel",
        "maxLength": 50
      },
      {
        "key": "direccion",
        "label": "Dirección",
        "type": "textarea"
      },
      {
        "key": "horario_desde",
        "label": "Horario desde",
        "type": "time"
      },
      {
        "key": "horario_hasta",
        "label": "Horario hasta",
        "type": "time"
      },
      {
        "key": "observaciones",
        "label": "Observaciones",
        "type": "textarea"
      }
    ]
  },
  "clients": {
    "label": "Clientes",
    "singular": "Cliente",
    "table": "cliente",
    "description": "Clientes, teléfonos y direcciones de entrega.",
    "fields": [
      {
        "key": "nombre",
        "label": "Nombre",
        "required": true,
        "maxLength": 120
      },
      {
        "key": "telefono",
        "label": "Teléfono",
        "type": "tel",
        "maxLength": 50
      },
      {
        "key": "direccion",
        "label": "Dirección",
        "type": "textarea"
      },
      {
        "key": "localidad",
        "label": "Localidad",
        "maxLength": 120
      },
      {
        "key": "observaciones",
        "label": "Observaciones",
        "type": "textarea"
      }
    ]
  },
  "sellers": {
    "label": "Vendedores",
    "singular": "Vendedor",
    "table": "vendedor",
    "description": "Vendedores, teléfonos y porcentajes de comisión.",
    "fields": [
      {
        "key": "nombre",
        "label": "Nombre",
        "required": true,
        "maxLength": 120
      },
      {
        "key": "telefono",
        "label": "Teléfono",
        "type": "tel",
        "maxLength": 50
      },
      {
        "key": "porcentaje_comision",
        "label": "Comisión (%)",
        "type": "number",
        "required": true
      },
      {
        "key": "observaciones",
        "label": "Observaciones",
        "type": "textarea"
      }
    ]
  }
};
