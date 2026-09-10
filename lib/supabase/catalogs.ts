import { getSupabase } from "./client";
import type { Database } from "./types";
import { catalogConfig, type CatalogId, type MasterRecord } from "@/config/catalogs";



export async function persistRecord(catalog: CatalogId, record: MasterRecord, isNew: boolean): Promise<MasterRecord> {
  const values: Record<string, string | number | null> = {};
  for (const field of catalogConfig[catalog].fields) values[field.key] = record[field.key] ?? null;
  // Fields are validated by the form and the database. Never submit a locally generated ID.
  const client = getSupabase();
  const query = (() => {
    switch (catalog) {
      case "products": {
        const payload = values as Database["public"]["Tables"]["producto"]["Insert"];
        return isNew ? client.from("producto").insert(payload) : client.from("producto").update(payload).eq("id", record.id);
      }
      case "suppliers": {
        const payload = values as Database["public"]["Tables"]["proveedor"]["Insert"];
        return isNew ? client.from("proveedor").insert(payload) : client.from("proveedor").update(payload).eq("id", record.id);
      }
      case "clients": {
        const payload = values as Database["public"]["Tables"]["cliente"]["Insert"];
        return isNew ? client.from("cliente").insert(payload) : client.from("cliente").update(payload).eq("id", record.id);
      }
      case "sellers": {
        const payload = values as Database["public"]["Tables"]["vendedor"]["Insert"];
        return isNew ? client.from("vendedor").insert(payload) : client.from("vendedor").update(payload).eq("id", record.id);
      }
    }
  })();
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data;
}

export function catalogError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "23505") return "Ya existe un registro con esos datos.";
  if (code === "42501") return "La base de datos rechazó esta operación.";
  if (code === "PGRST116") return "El registro ya no está disponible. Volvé a cargar el catálogo.";
  return "No se pudo completar la operación. Revisá la conexión y volvé a intentar.";
}
