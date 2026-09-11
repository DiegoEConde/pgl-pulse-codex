"use client";
import { useRef, useState, type FormEvent } from "react";
import { Eye, Plus, Search, X } from "lucide-react";
import WorkspaceTabs from "@/components/ui/WorkspaceTabs";
import PagedTable from "@/components/ui/PagedTable";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useProgram } from "@/contexts/ProgramContext";
import { useOperation } from "@/hooks/useOperation";
import { runOperation } from "@/lib/supabase/operations";
import { encodePurchaseDetails } from "@/lib/purchase-details";
import { formatUsd } from "@/lib/formatters";
import { formatDate } from "@/lib/dates";
import type { PurchaseOrder, PurchaseStatus } from "@/types/operations";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./PurchasesScreen.module.css";

const statusClass: Record<PurchaseStatus, string> = { BORRADOR: "muted-badge", PEDIDO: "amber", "ENVÍO": "blue", RECIBIDO: "green" };
export default function PurchasesScreen() {
  const { raw, orders, today } = useProgram();
  const { busy, error, setError, run } = useOperation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "TODOS">("TODOS");
  const [detailId, setDetailId] = useState<number | null>(null);
  const detail = orders.find(order => order.id === detailId);
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lineKeys, setLineKeys] = useState([0]);
  const lineCounter = useRef(0);
  const requestId = useRef("");
  const matches = (order: PurchaseOrder) => `${order.id} ${order.supplier} ${order.products.join(" ")}`.toLowerCase().includes(search.toLowerCase()) && (status === "TODOS" || order.status === status);
  const todayOrders = orders.filter(order => order.date === today && !order.closed && matches(order));
  const history = orders.filter(order => (order.date !== today || order.closed) && matches(order));
  const receiptRows = detail?.lines.flatMap(line => Array.from({ length: line.cantidad }, (_, index) => ({ line, key: line.id + "-" + index }))) ?? [];

  function close() {
    if (busy) return;
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setCreating(false); setReceiving(false); setDetailId(null); setDirty(false); setError("");
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = lineKeys.map(key => ({ producto_id: Number(form.get("product-" + key)), color: String(form.get("color-" + key)).trim(), cantidad: Number(form.get("quantity-" + key)), precio_costo_usd: Number(form.get("cost-" + key)) }));
    void run(() => runOperation("pgl_create_order", {
      p_supplier: Number(form.get("supplier")), p_date: String(form.get("date")), p_expected: String(form.get("expected")),
      p_shipping: Number(form.get("shipping")), p_notes: encodePurchaseDetails(String(form.get("notes") ?? ""), lineKeys.map((key,index) => ({ producto_id: lines[index].producto_id, color: lines[index].color, ram: String(form.get("memory-ram-" + key) ?? "").trim(), rom: String(form.get("memory-rom-" + key) ?? "").trim() }))), p_lines: lines, p_request: requestId.current,
    }), id => { setCreating(false); setDirty(false); setDetailId(Number(id)); });
  }
  function receive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const form = new FormData(event.currentTarget);
    const units = receiptRows.map(({ line, key }) => ({
      detalle_id: line.id, codigo: String(form.get("code-" + key) ?? ""), variante: String(form.get("variant-" + key) ?? ""),
      ram: String(form.get("ram-" + key) ?? ""), precio_sugerido_usd: String(form.get("price-" + key) ?? ""),
    }));
    void run(() => runOperation("pgl_receive_order", { p_id: detail.id, p_units: units }), () => { setReceiving(false); setDirty(false); });
  }
  function table(source: PurchaseOrder[], empty: string) {
    return source.length ? <PagedTable><thead><tr><th>Pedido</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th>Total</th><th></th></tr></thead><tbody>{source.map(order => <tr key={order.id} onClick={() => { setDetailId(order.id); setError(""); }}><td className="mono">#{order.id}</td><td>{order.supplier}</td><td>{formatDate(order.date)}</td><td><span className={`badge ${statusClass[order.status]}`}>{order.status}</span></td><td>{formatUsd(order.merchandiseUsd + order.shippingUsd)}</td><td><button className={styles.tableButton} aria-label={`Ver pedido ${order.id}`}><Eye size={14} /> Ver</button></td></tr>)}</tbody></PagedTable> : <div className={styles.empty}>{empty}</div>;
  }
  return <div className={`view ${layout.page}`}>
    <PageHeader title="Compras" action={<button className={`primary-btn ${layout.headAction}`} disabled={!raw.products.length || !raw.suppliers.length} onClick={() => { requestId.current = crypto.randomUUID(); setLineKeys([++lineCounter.current]); setCreating(true); setDirty(false); setError(""); }}><Plus size={16} /> Nueva compra</button>} />
    {(!raw.products.length || !raw.suppliers.length) && <p>Creá al menos un producto y un proveedor en Datos para registrar compras.</p>}
    <div className={layout.toolbar}><label className={layout.searchWrap}><Search size={15} /><input className="search" aria-label="Buscar compras" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedido, proveedor o producto…" /></label><select className="filter" aria-label="Estado de compra" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="TODOS">Todos los estados</option>{Object.keys(statusClass).map(value => <option key={value}>{value}</option>)}</select></div>
    <WorkspaceTabs labels={["Pedidos de hoy", "Historial"]}>    <section className="panel"><header className="panel-head"><div><span className="eyebrow">Operación del día · {formatDate(today)}</span><h2>Pedidos de hoy</h2></div><span className="badge blue">{todayOrders.length} pedidos</span></header><div className="table-wrap">{table(todayOrders, "No hay pedidos abiertos para hoy.")}</div></section>
    <section className="panel"><header className="panel-head"><h2>Historial</h2><span className="badge muted-badge">{history.length} resultados</span></header><div className="table-wrap">{table(history, "No hay pedidos que coincidan con la búsqueda.")}</div></section>
    </WorkspaceTabs>
    {detail && !creating && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Pedido ${detail.id}`}>
      <header className={styles.modalHeader}><h2>Pedido #{detail.id}</h2><button className={styles.close} aria-label="Cerrar detalle" disabled={busy} onClick={close}><X size={20} /></button></header>
      <div className={styles.detailGrid}>{[["Proveedor", detail.supplier], ["Estado", detail.status], ["Recepción estimada", formatDate(detail.expectedDate)], ["Mercadería", formatUsd(detail.merchandiseUsd)], ["Envío", formatUsd(detail.shippingUsd)], ["Total", formatUsd(detail.merchandiseUsd + detail.shippingUsd)]].map(([label,value]) => <div className={styles.detailItem} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className={styles.detailBody}><h3>Resumen de lo solicitado</h3><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Color</th><th>Unidades</th><th>Unitario</th><th>Total</th></tr></thead><tbody>{detail.lines.map(line => <tr key={line.id}><td>{line.product}<small className="record-note">RAM / ROM: {line.ram || "—"} / {line.rom || "—"} GB</small></td><td>{line.color}</td><td>{line.cantidad}</td><td>{formatUsd(line.precio_costo_usd)}</td><td>{formatUsd(line.cantidad * line.precio_costo_usd)}</td></tr>)}</tbody></table></div>{detail.notes && <p>{detail.notes}</p>}{error && <p className="operation-error" role="alert">{error}</p>}</div>
      {!receiving && <footer className={styles.modalActions}>
        {detail.status === "BORRADOR" && <button className="primary-btn" disabled={busy} onClick={() => void run(() => runOperation("pgl_order_status", { p_id: detail.id, p_status: "PEDIDO" }))}>Confirmar pedido</button>}
        {detail.status === "PEDIDO" && <button className={styles.cancel} disabled={busy} onClick={() => void run(() => runOperation("pgl_order_status", { p_id: detail.id, p_status: "ENVÍO" }))}>Marcar en envío</button>}
        {(detail.status === "PEDIDO" || detail.status === "ENVÍO") && <button className="primary-btn" disabled={busy} onClick={() => { setReceiving(true); setError(""); }}>Registrar recepción</button>}
        {detail.status === "RECIBIDO" && <span className="badge green">{detail.receivedUnits} unidades recibidas</span>}
      </footer>}
      {receiving && <form onSubmit={receive} onChange={() => setDirty(true)}><fieldset className="form-fields" disabled={busy}><div className={styles.form}><h3>Recepción completa · {receiptRows.length} unidades</h3><p>Completá los códigos si están disponibles. Podés agregar variante, RAM y precio sugerido ahora o desde Stock.</p>{receiptRows.map(({ line, key }, index) => <div className={styles.receiptLine} key={key}><h4>{index + 1}. {line.product} · {line.color}</h4><div className={styles.formGrid}>{[["code","IMEI / serie",120],["variant","Variante / almacenamiento",120],["ram","RAM",60]].map(([name,label,max]) => <div className={styles.field} key={String(name)}><label htmlFor={name + "-" + key}>{label}</label><input id={name + "-" + key} name={name + "-" + key} maxLength={Number(max)} defaultValue={name === "ram" ? line.ram : name === "variant" ? line.rom : ""} /></div>)}<div className={styles.field}><label htmlFor={"price-" + key}>Precio sugerido USD</label><input id={"price-" + key} name={"price-" + key} type="number" min="0" step="0.01" /></div></div></div>)}</div><footer className={styles.modalActions}><button className="primary-btn" type="submit">{busy ? "Guardando…" : "Confirmar recepción"}</button></footer></fieldset></form>}
    </section></div>}
    {creating && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Nueva compra"><header className={styles.modalHeader}><h2>Nueva compra</h2><button className={styles.close} aria-label="Cerrar compra" disabled={busy} onClick={close}><X size={20} /></button></header>
      <form onSubmit={create} onChange={() => setDirty(true)}><fieldset className="form-fields" disabled={busy}><div className={styles.form}><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor="supplier">Proveedor</label><select id="supplier" name="supplier" required defaultValue=""><option value="" disabled>Seleccionar proveedor</option>{raw.suppliers.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="date">Fecha del pedido</label><input id="date" name="date" type="date" required defaultValue={today} max={today} /></div>
        <div className={styles.field}><label htmlFor="expected">Recepción estimada</label><input id="expected" name="expected" type="date" required defaultValue={today} /></div>
        <div className={styles.field}><label htmlFor="shipping">Costo envío USD</label><input id="shipping" name="shipping" type="number" min="0" step="0.01" required defaultValue="0" /></div>
      </div>
      {lineKeys.map((key,index) => <div className={styles.receiptLine} key={key}><h3>Producto {index + 1}</h3><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor={"product-" + key}>Producto</label><select id={"product-" + key} name={"product-" + key} required defaultValue=""><option value="" disabled>Seleccionar producto</option>{raw.products.map(item => <option key={item.id} value={item.id}>{item.marca} · {item.nombre}</option>)}</select></div>
        <div className={styles.field}><label htmlFor={"color-" + key}>Color</label><input id={"color-" + key} name={"color-" + key} maxLength={60} required /></div>
        {[["ram", "RAM (GB)"], ["rom", "Almacenamiento / ROM (GB)"]].map(([name, label]) => <div className={styles.field} key={name}><label htmlFor={"memory-" + name + "-" + key}>{label}</label><input id={"memory-" + name + "-" + key} name={"memory-" + name + "-" + key} type="number" min="1" max="65536" step="1" placeholder={name === "ram" ? "12" : "128"} /></div>)}
        <div className={styles.field}><label htmlFor={"quantity-" + key}>Cantidad</label><input id={"quantity-" + key} name={"quantity-" + key} type="number" min="1" max="1000" step="1" required defaultValue="1" /></div>
        <div className={styles.field}><label htmlFor={"cost-" + key}>Costo unitario USD</label><input id={"cost-" + key} name={"cost-" + key} type="number" min="0" step="0.01" required /></div>
      </div>{lineKeys.length > 1 && <button type="button" className={styles.cancel} onClick={() => { setLineKeys(keys => keys.filter(item => item !== key)); setDirty(true); }}>Quitar producto {index + 1}</button>}</div>)}
      <button type="button" className={styles.cancel} disabled={lineKeys.length >= 100} onClick={() => { setLineKeys(keys => [...keys, ++lineCounter.current]); setDirty(true); }}>Agregar producto</button>
      <div className={styles.field}><label htmlFor="notes">Observaciones</label><textarea id="notes" name="notes" /></div>
      <p className={styles.formNote}>El pedido se guarda como borrador. Las unidades ingresan a Stock al confirmar su recepción.</p>{error && <p className="operation-error" role="alert">{error}</p>}
      </div><footer className={styles.modalActions}><button type="button" className={styles.cancel} onClick={close}>Cancelar</button><button className="primary-btn" type="submit">{busy ? "Guardando…" : "Crear borrador"}</button></footer></fieldset></form>
    </section></div>}
  </div>;
}
