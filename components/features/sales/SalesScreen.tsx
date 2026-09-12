"use client";
import { useRef, useState, type FormEvent } from "react";
import { Eye, Plus, Search, X } from "lucide-react";
import WorkspaceTabs from "@/components/ui/WorkspaceTabs";
import PagedTable from "@/components/ui/PagedTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useProgram } from "@/contexts/ProgramContext";
import { useOperation } from "@/hooks/useOperation";
import { runOperation } from "@/lib/supabase/operations";
import { formatUsd } from "@/lib/formatters";
import { formatDate } from "@/lib/dates";
import type { Sale, SaleStatus } from "@/types/operations";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./SalesScreen.module.css";

export default function SalesScreen() {
  const { raw, sales, stock, today } = useProgram();
  const { busy, error, setError, run } = useOperation();
  const available = stock.filter(unit => unit.state === "STOCK");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SaleStatus | "TODOS">("TODOS");
  const [detailId, setDetailId] = useState<number | null>(null);
  const detail = sales.find(sale => sale.id === detailId);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [unitId, setUnitId] = useState("");
  const selected = available.find(unit => String(unit.databaseId) === unitId);
  // La RPC reutiliza este UUID en reintentos y bloquea la unidad para evitar ventas dobles.
  const requestId = useRef("");
  const matches = (sale: Sale) => `${sale.id} ${sale.product} ${sale.code} ${sale.client} ${sale.seller}`.toLowerCase().includes(search.toLowerCase()) && (status === "TODOS" || sale.status === status);
  const salesToday = sales.filter(sale => sale.date === today && matches(sale));
  const history = sales.filter(sale => sale.date !== today && matches(sale));
  function close() {
    if (busy) return;
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setCreating(false); setDetailId(null); setDirty(false); setError("");
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) { setError("La unidad seleccionada ya no está disponible."); return; }
    const form = new FormData(event.currentTarget);
    void run(() => runOperation("pgl_create_sale", { p_unit: selected.databaseId, p_client: Number(form.get("client")), p_seller: Number(form.get("seller")),
      p_date: String(form.get("date")), p_price: Number(form.get("price")), p_commission: Number(form.get("commission")), p_paid: form.get("paid") === "on", p_request: requestId.current,
    }), id => { setCreating(false); setDirty(false); setDetailId(Number(id)); });
  }
  function table(source: Sale[]) {
    return source.length ? <PagedTable><thead><tr><th>Venta / unidad</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Pago</th><th></th></tr></thead><tbody>{source.map(sale => <tr key={sale.id} onClick={() => { setDetailId(sale.id); setError(""); }}><td className="mono">#{sale.id}</td><td>{sale.client}</td><td>{formatDate(sale.date)}</td><td><span className={`badge ${sale.status === "ENTREGADA" ? "green" : "violet"}`}>{sale.status === "ENTREGADA" ? "Entregada" : "En reparto"}</span></td><td>{formatUsd(sale.priceUsd)}</td><td>{sale.paid ? "Verificado" : "Pendiente"}</td><td><button className={styles.rowAction} aria-label={`Ver venta ${sale.id}`}><Eye size={14} /> Ver</button></td></tr>)}</tbody></PagedTable> : <div className={styles.empty}>No hay ventas que coincidan con esta búsqueda.</div>;
  }
  return <div className={`view ${layout.page}`}>
    <PageHeader title="Ventas" action={<button className={`primary-btn ${layout.headAction}`} disabled={!available.length || !raw.clients.length || !raw.sellers.length} onClick={() => { setUnitId(String(available[0]?.databaseId ?? "")); requestId.current = crypto.randomUUID(); setCreating(true); setDirty(false); setError(""); }}><Plus size={16} /> Nueva venta</button>} />
    <div className={layout.toolbar}><label className={layout.searchWrap}><Search size={15} /><input className="search" aria-label="Buscar ventas" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar venta, cliente o unidad…" /></label><select className="filter" aria-label="Estado de venta" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="TODOS">Todos los estados</option><option value="REPARTO">En reparto</option><option value="ENTREGADA">Entregada</option></select></div>
    <WorkspaceTabs labels={["Ventas de hoy", "Historial"]}>    <section className="panel"><header className="panel-head"><div><span className="eyebrow">{formatDate(today)}</span><h2>Ventas de hoy</h2></div><span className="badge blue">{salesToday.length} ventas</span></header><div className="table-wrap">{table(salesToday)}</div></section>
    <section className="panel"><header className="panel-head"><h2>Historial</h2><span className="badge muted-badge">{history.length} resultados</span></header><div className="table-wrap">{table(history)}</div></section>
    </WorkspaceTabs>
    {detail && !creating && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Venta ${detail.id}`}><header className={styles.modalHeader}><h2>Venta #{detail.id}</h2><button className={styles.close} aria-label="Cerrar venta" disabled={busy} onClick={close}><X size={20} /></button></header>
      <div className={styles.detailGrid}>{[["Cliente",detail.client],["Vendedor",detail.seller],["Fecha de venta",formatDate(detail.date)],["Producto",detail.product],["Unidad / serie",detail.unitId + " · " + (detail.code || "Sin código")],["Total",formatUsd(detail.priceUsd)],["Costo con envío",formatUsd(detail.costUsd)],["Comisión",formatUsd(detail.commissionUsd)],["Ganancia",formatUsd(detail.priceUsd-detail.costUsd-detail.commissionUsd)],["Estado",detail.status],["Pago",detail.paid ? "Verificado" : "Pendiente"],["Entrega",formatDate(detail.deliveredAt)]].map(([label,value]) => <div className={styles.detailItem} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className={styles.detailBody}>{error && <p role="alert" className="operation-error">{error}</p>}<button className={styles.cancel} disabled={busy} onClick={() => void run(() => runOperation("pgl_set_payment", { p_id: detail.id, p_paid: !detail.paid }))}>{detail.paid ? "Marcar pago pendiente" : "Verificar pago"}</button></div>
    </section></div>}
    {creating && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Registrar venta"><header className={styles.modalHeader}><h2>Registrar venta</h2><button className={styles.close} aria-label="Cerrar venta" disabled={busy} onClick={close}><X size={20} /></button></header><form onSubmit={create} onChange={() => setDirty(true)}><fieldset disabled={busy} className="form-fields"><div className={styles.form}><div className={styles.formGrid}>
      <div className={`${styles.field} ${styles.wide}`}><label htmlFor="unit">Unidad disponible</label><select id="unit" value={unitId} onChange={e => setUnitId(e.target.value)} required><option value="" disabled>Seleccionar unidad</option>{available.map(unit => <option key={unit.id} value={unit.databaseId}>{unit.id} · {unit.product} · {unit.code || unit.color}</option>)}</select></div>
      {selected && <div className={`${styles.unitPreview} ${styles.wide}`}><strong>{selected.product}</strong><small>{selected.variant} · {selected.color} · Costo con envío: {formatUsd(selected.costUsd)}</small></div>}
      <div className={styles.field}><label htmlFor="client">Cliente</label><select id="client" name="client" required defaultValue=""><option value="" disabled>Seleccionar cliente</option>{raw.clients.map(client => <option key={client.id} value={client.id}>{client.nombre}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="seller">Vendedor</label><select id="seller" name="seller" required defaultValue=""><option value="" disabled>Seleccionar vendedor</option>{raw.sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.nombre} · {seller.porcentaje_comision}%</option>)}</select></div>
      <div className={styles.field}><label htmlFor="price">Precio de venta USD</label><input id="price" name="price" type="number" min="0" step="0.01" required key={unitId} defaultValue={selected?.salePriceUsd ?? ""} /></div>
      <div className={styles.field}><label htmlFor="commission">Comisión USD</label><input id="commission" name="commission" type="number" min="0" step="0.01" required defaultValue="0" /></div>
      <div className={styles.field}><label htmlFor="date">Fecha de venta</label><input id="date" name="date" type="date" required defaultValue={today} min={selected?.receivedAt} max={today} /></div>
      <div className={styles.field}><label htmlFor="paid">Pago verificado</label><div className={styles.check}><input id="paid" name="paid" type="checkbox" /><span>Confirmar que el pago fue recibido.</span></div></div>
    </div>{error && <p role="alert" className="operation-error">{error}</p>}<p>La unidad quedará reservada en Reparto hasta confirmar su entrega.</p></div><footer className={styles.actions}><button className={styles.cancel} type="button" onClick={close}>Cancelar</button><button className="primary-btn" type="submit">{busy ? "Guardando…" : "Guardar venta"}</button></footer></fieldset></form></section></div>}
  </div>;
}
