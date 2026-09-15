export type PurchaseOption = { categoria: string; producto_id: number | null; clave: string; etiqueta: string; valores: string[] };
export const initialPurchaseOptions: PurchaseOption[] = [
 { categoria: "*", producto_id: null, clave: "color", etiqueta: "Color", valores: ["Negro", "Blanco", "Gris", "Plata", "Dorado", "Azul", "Celeste", "Verde", "Rojo", "Rosa", "Violeta", "Morado", "Amarillo", "Naranja", "Marrón", "Beige", "Titanio", "Natural", "Transparente", "Multicolor"] },
 { categoria: "celulares", producto_id: null, clave: "ram", etiqueta: "RAM (GB)", valores: ["2", "3", "4", "6", "8", "12", "16", "18", "24"] },
 { categoria: "celulares", producto_id: null, clave: "rom", etiqueta: "Almacenamiento / ROM (GB)", valores: ["32", "64", "128", "256", "512", "1024", "2048"] },
 { categoria: "consolas", producto_id: null, clave: "edicion", etiqueta: "Variante", valores: ["Física", "Digital", "Pro", "Edición especial"] },
];
// Una configuración específica del producto sustituye la de su categoría.
export function purchaseOptions(options: PurchaseOption[], product?: { id: number; categoria: string }) {
 const fields = new Map<string, PurchaseOption>();
 for (const tier of [0, 1, 2]) for (const option of options) {
  const level = option.producto_id !== null ? 2 : option.categoria === "*" ? 0 : 1;
  if (level !== tier || (level === 2 ? option.producto_id !== product?.id : level === 1 && option.categoria.toLowerCase() !== product?.categoria.toLowerCase())) continue;
  fields.set(option.clave, option);
 }
 return [...fields.values()];
}
