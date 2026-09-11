"use client";
import { useState } from "react";
import { Clock3, MapPin, Phone, Truck } from "lucide-react";

import type { buildDeliveryGroups } from "@/lib/delivery";
import { formatUsd } from "@/lib/formatters";
import styles from "./DeliveryScreen.module.css";

type Group = ReturnType<typeof buildDeliveryGroups>[number];
function SupplierCard({ group }: { group: Group }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(group.lines.length / 2);
  const current = Math.min(page, pages - 1);
  const count = new Set(group.lines.map(line => line.orderId)).size;
  return <article className={styles.card} aria-label={"Reparto de " + group.name}>
    <header className={styles.cardHeader}>
      <div className={styles.identity}><span className={styles.icon}><Truck size={19} /></span><div><h2>{group.name}</h2><small>{count} {count === 1 ? "pedido" : "pedidos"} · {group.lines.reduce((sum,line) => sum + line.quantity,0)} unidades</small></div></div>
      <span className={styles.schedule}><Clock3 size={14} />{group.from && group.until ? group.from + " – " + group.until : group.from ? "Desde " + group.from : group.until ? "Hasta " + group.until : "Horario sin definir"}</span>
      <div className={styles.contact}><span><MapPin size={13} />{group.address || "Dirección sin cargar"}</span><span><Phone size={13} />{group.phone || "Teléfono sin cargar"}</span></div>
    </header>
    <div className={styles.items}>
      {group.lines.slice(current * 2, current * 2 + 2).map(line => <div className={styles.item} key={line.id}>
        <div><strong>{line.product}</strong><small>Pedido #{line.orderId} · {line.status === "BORRADOR" ? "Borrador" : line.status === "PEDIDO" ? "Pedido" : "En envío"}</small></div>
        <div><span className={styles.label}>RAM / ROM</span><span>{line.ram || "—"} / {line.rom || "—"}{line.ram || line.rom ? " GB" : ""}</span></div>
        <div><span className={styles.label}>Color</span><span>{line.color}</span></div>
        <div className={styles.price}><strong>{formatUsd(line.cost)}</strong><small>Costo unitario · ×{line.quantity}</small></div>
      </div>)}
    </div>
    <footer className={styles.cardFooter}><span>{group.lines.length} {group.lines.length === 1 ? "producto solicitado" : "productos solicitados"}</span>{pages > 1 && <div><button aria-label={"Productos anteriores de " + group.name} disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button><span>{current + 1}/{pages}</span><button aria-label={"Productos siguientes de " + group.name} disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Siguiente</button></div>}</footer>
  </article>;
}
export default function SupplierDeliveries({ groups, loading }: { groups: Group[]; loading: boolean }) {
  return <div className={styles.board}>
    {!groups.length ? <div className={styles.empty}><Truck size={30} /><h2>{loading ? "Cargando repartos…" : "Todavía no hay repartos"}</h2><p>Al crear una compra, sus productos aparecerán agrupados por proveedor y ordenados por horario.</p></div> : groups.map(group => <SupplierCard key={group.supplierId} group={group} />)}
  </div>;
}
