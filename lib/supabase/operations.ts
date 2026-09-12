import { getSupabase } from "./client";
import type { Database } from "./types";

type Functions = Database["public"]["Functions"];
// Las RPC validan estados y guardan cada operación completa dentro de una transacción.
export async function runOperation<K extends keyof Functions>(name: K, args: Functions[K]["Args"]) {
  const { data, error } = await getSupabase().rpc(name, args);
  if (error) throw error;
  return data;
}
export function operationError(error: unknown) {
  const value = error as { code?: string; message?: string };
  if (value?.code === "23505") return "Hay un código/IMEI o una combinación de producto y color repetidos.";
  if (value?.code === "23503") return "El registro relacionado no existe. Actualizá los datos.";
  if (value?.code === "23514" || value?.code === "22003" || value?.code === "22007" || value?.code === "22P02") return "Revisá las cantidades, fechas e importes ingresados.";
  if (value?.code === "P0001" && value.message) return value.message;
  return "No se pudo guardar. Revisá la conexión y volvé a intentar.";
}
