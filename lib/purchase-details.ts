// Versioned envelope keeps optional purchase specifications atomic with the existing RPC.
export type MemorySpec = { producto_id: number; color: string; ram: string; rom: string };
const marker = "pgl.purchase-details.v1";
export function encodePurchaseDetails(notes: string, lines: MemorySpec[]) {
  if (!lines.some(line => line.ram || line.rom)) return notes;
  return JSON.stringify({ format: marker, notes, lines });
}
export function decodePurchaseDetails(value: string | null | undefined): { notes: string; lines: MemorySpec[] } {
  const original = value ?? "";
  try {
    const data = JSON.parse(original);
    if (data?.format !== marker || typeof data.notes !== "string" || !Array.isArray(data.lines) ||
      !data.lines.every((line: MemorySpec) => line && Number.isInteger(line.producto_id) && typeof line.color === "string" && typeof line.ram === "string" && typeof line.rom === "string")) return { notes: original, lines: [] };
    return { notes: data.notes, lines: data.lines };
  } catch { return { notes: original, lines: [] }; }
}
