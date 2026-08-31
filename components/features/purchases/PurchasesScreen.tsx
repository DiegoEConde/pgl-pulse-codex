"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, Box, CircleDollarSign, Clock3, Eye, PackageCheck, Plus, Search, Ship, X } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard/MetricCard";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import { purchaseOrdersMock, suppliersMock, type PurchaseOrder, type PurchaseStatus } from "@/lib/mock/purchases";
import styles from "./PurchasesScreen.module.css";

const statusClass: Record<PurchaseStatus, string> = { BORRADOR: "muted-badge", PEDIDO: "amber", ENVÍO: "blue", RECIBIDO: "green" };
const formatDate = (date: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

export default function PurchasesScreen() {
  const [orders, setOrders] = useState(purchaseOrdersMock);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "TODOS">("TODOS");
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesText = `${order.id} ${order.supplier} ${order.products.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    return matchesText && (status === "TODOS" || order.status === status);
  }), [orders, search, status]);

  const inTransit = orders.filter((order) => order.status === "ENVÍO").reduce((sum, order) => sum + order.units, 0);
  const received = orders.filter((order) => order.status === "RECIBIDO").reduce((sum, order) => sum + order.receivedUnits, 0);
  const invested = orders.reduce((sum, order) => sum + order.merchandiseUsd + order.shippingUsd, 0);

  function requestClose() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setCreating(false);
    setDirty(false);
  }

  function createOrder(formData: FormData) {
    const units = Number(formData.get("units"));
    const merchandiseUsd = Number(formData.get("merchandise"));
    const shippingUsd = Number(formData.get("shipping"));
    const next: PurchaseOrder = {
      id: Math.max(...orders.map((order) => order.id)) + 1,
      supplier: String(formData.get("supplier")),
      date: String(formData.get("date")),
      expectedDate: String(formData.get("expectedDate")),
      units,
      receivedUnits: 0,
      status: "BORRADOR",
      products: [String(formData.get("product"))],
      merchandiseUsd,
      shippingUsd,
      notes: String(formData.get("notes")),
    };
    setOrders((current) => [next, ...current]);
    setCreating(false);
    setDirty(false);
    setDetail(next);
  }

  return <div className={`view ${styles.page}`}>
    <PageHeader eyebrow="Abastecimiento" title="Compras" description="Pedidos a proveedores y origen trazable de cada unidad física." action={<button className={`primary-btn ${styles.headAction}`} onClick={() => setCreating(true)}><Plus size={16} /> Nuevo pedido</button>} />

    <section className={styles.summary}>
      <MetricCard label="En tránsito" value={String(inTransit)} detail="Unidades pendientes de recepción" icon={<Ship size={17} />} />
      <MetricCard label="Recibidas" value={String(received)} detail="Unidades identificadas este período" icon={<PackageCheck size={17} />} color="var(--green)" />
      <MetricCard label="Pedidos abiertos" value={String(orders.filter((order) => order.status !== "RECIBIDO").length)} detail="Incluye borradores y envíos" icon={<Clock3 size={17} />} color="var(--amber)" />
      <MetricCard label="Inversión" value={formatUsd(invested)} detail="Mercadería y envíos registrados" icon={<CircleDollarSign size={17} />} color="var(--violet)" />
    </section>

    <section className="panel">
      <header className="panel-head"><div><span className="eyebrow">Registro operativo</span><h2>Pedidos a proveedores</h2></div><span className="badge blue">Datos de demostración</span></header>
      <div className={styles.toolbar}>
        <label className={styles.searchWrap}><Search size={15} /><input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido, proveedor o producto…" /></label>
        <select className="filter" value={status} onChange={(event) => setStatus(event.target.value as PurchaseStatus | "TODOS")}><option value="TODOS">Todos los estados</option><option value="BORRADOR">Borrador</option><option value="PEDIDO">Pedido</option><option value="ENVÍO">En envío</option><option value="RECIBIDO">Recibido</option></select>
        <span className={styles.count}>{filtered.length} PEDIDOS</span>
      </div>
      <div className="table-wrap">
        {filtered.length ? <table><thead><tr><th>Pedido</th><th>Proveedor</th><th>Fecha</th><th>Recepción</th><th>Estado</th><th>Total</th><th></th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} onClick={() => setDetail(order)}><td className="mono">#{order.id}</td><td className="product-cell"><strong>{order.supplier}</strong><small>{order.products.join(" · ")}</small></td><td>{formatDate(order.date)}</td><td><span>{order.receivedUnits} / {order.units} unidades</span><div className={styles.progress}><i style={{ width: `${order.units ? order.receivedUnits / order.units * 100 : 0}%` }} /></div></td><td><span className={`badge ${statusClass[order.status]}`}>{order.status}</span></td><td>{formatUsd(order.merchandiseUsd + order.shippingUsd)}</td><td><button className={styles.tableButton} onClick={(event) => { event.stopPropagation(); setDetail(order); }}><Eye size={14} /> Ver</button></td></tr>)}</tbody></table> : <div className={styles.empty}>No hay pedidos que coincidan con los filtros.</div>}
      </div>
    </section>

    {detail && <div className={styles.modalOverlay} onMouseDown={(event) => { if (event.currentTarget === event.target) setDetail(null); }}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">Pedido #{detail.id}</span><h2>{detail.supplier}</h2></div><button className={styles.close} onClick={() => setDetail(null)}><X size={20} /></button></header><div className={styles.detailGrid}>{[["Estado", <span key="status" className={`badge ${statusClass[detail.status]}`}>{detail.status}</span>],["Fecha del pedido", formatDate(detail.date)],["Recepción estimada", formatDate(detail.expectedDate)],["Unidades", `${detail.receivedUnits} recibidas de ${detail.units}`],["Mercadería", formatUsd(detail.merchandiseUsd)],["Envío", formatUsd(detail.shippingUsd)]].map(([label, value]) => <div className={styles.detailItem} key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className={styles.detailBody}><h3>Productos incluidos</h3>{detail.products.map((product) => <div className={styles.productLine} key={product}><span>{product}</span><span>{detail.units} unidades solicitadas</span></div>)}{detail.notes && <div className={styles.acuCallout}>{detail.notes}</div>}<div className={styles.acuCallout}><Box size={15} /> Al confirmar la recepción, cada equipo deberá convertirse en una Unidad individual con identidad propia.</div></div></section></div>}

    {creating && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">Abastecimiento</span><h2>Nuevo pedido</h2></div><button className={styles.close} onClick={requestClose}><X size={20} /></button></header><form onChange={() => setDirty(true)} action={createOrder}><div className={styles.form}><div className={styles.formGrid}><div className={styles.field}><label htmlFor="supplier">Proveedor</label><select id="supplier" name="supplier" required defaultValue=""><option value="" disabled>Seleccionar proveedor</option>{suppliersMock.map((supplier) => <option key={supplier}>{supplier}</option>)}</select></div><div className={styles.field}><label htmlFor="date">Fecha del pedido</label><input id="date" name="date" type="date" required defaultValue="2026-08-31" /></div><div className={styles.field}><label htmlFor="product">Producto</label><input id="product" name="product" required placeholder="Ej. iPhone 16 Pro" /></div><div className={styles.field}><label htmlFor="units">Cantidad de unidades</label><input id="units" name="units" type="number" min="1" required placeholder="0" /></div><div className={styles.field}><label htmlFor="expectedDate">Recepción estimada</label><input id="expectedDate" name="expectedDate" type="date" required /></div><div className={styles.field}><label htmlFor="merchandise">Costo mercadería USD</label><input id="merchandise" name="merchandise" type="number" min="0" step="0.01" required placeholder="0" /></div><div className={styles.field}><label htmlFor="shipping">Costo envío USD</label><input id="shipping" name="shipping" type="number" min="0" step="0.01" required defaultValue="0" /></div><div className={`${styles.field} ${styles.wide}`}><label htmlFor="notes">Observaciones</label><textarea id="notes" name="notes" placeholder="Condiciones, seguimiento o información relevante…" /></div></div><div className={styles.formNote}><ArrowDownToLine size={17} /> El pedido se guardará como borrador. Las unidades físicas se crearán recién al registrar la recepción.</div></div><footer className={styles.modalActions}><button type="button" className={styles.cancel} onClick={requestClose}>Cancelar</button><button type="submit" className={`primary-btn ${styles.save}`}><Plus size={15} /> Crear borrador</button></footer></form></section></div>}
  </div>;
}
