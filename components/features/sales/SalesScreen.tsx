"use client";

import { useMemo, useState } from "react";
import { BadgeDollarSign, Banknote, Box, CheckCircle2, CircleDollarSign, Clock3, Eye, Plus, Search, ShoppingBag, X } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard/MetricCard";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import { clientsMock, salesMock, sellersMock, stockUnitsMock, type Sale, type SaleStatus } from "@/lib/mock/sales";
import styles from "./SalesScreen.module.css";

const statusLabel: Record<SaleStatus, string> = { PENDIENTE: "Pendiente", PREPARANDO: "Preparando", EN_REPARTO: "En reparto", ENTREGADA: "Entregada" };
const statusClass: Record<SaleStatus, string> = { PENDIENTE: "amber", PREPARANDO: "blue", EN_REPARTO: "violet", ENTREGADA: "green" };
const formatDate = (date: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

export default function SalesScreen() {
  const [sales, setSales] = useState(salesMock);
  const [availableUnits, setAvailableUnits] = useState(stockUnitsMock);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SaleStatus | "TODOS">("TODOS");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(availableUnits[0]?.id ?? "");
  const selectedUnit = availableUnits.find((unit) => unit.id === selectedUnitId);

  const filtered = useMemo(() => sales.filter((sale) => {
    const matches = `${sale.id} ${sale.product} ${sale.code} ${sale.client} ${sale.seller}`.toLowerCase().includes(search.toLowerCase());
    return matches && (status === "TODOS" || sale.status === status);
  }), [sales, search, status]);

  const salesToday = sales.filter((sale) => sale.date === "2026-08-31");
  const revenue = salesToday.reduce((sum, sale) => sum + sale.priceUsd, 0);
  const profit = salesToday.reduce((sum, sale) => sum + sale.priceUsd - sale.costUsd - sale.commissionUsd, 0);
  const commissions = salesToday.reduce((sum, sale) => sum + sale.commissionUsd, 0);

  function requestClose() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setCreating(false);
    setDirty(false);
  }

  function createSale(formData: FormData) {
    if (!selectedUnit) return;
    const price = Number(formData.get("price"));
    const commission = Number(formData.get("commission"));
    const next: Sale = {
      id: Math.max(...sales.map((sale) => sale.id)) + 1,
      unitId: selectedUnit.id,
      product: selectedUnit.product,
      code: selectedUnit.code,
      client: String(formData.get("client")),
      seller: String(formData.get("seller")),
      date: String(formData.get("date")),
      priceUsd: price,
      costUsd: selectedUnit.costUsd,
      commissionUsd: commission,
      paid: formData.get("paid") === "on",
      status: "PREPARANDO",
    };
    setSales((current) => [next, ...current]);
    setAvailableUnits((current) => current.filter((unit) => unit.id !== selectedUnit.id));
    setCreating(false);
    setDirty(false);
    setDetail(next);
    const remaining = availableUnits.filter((unit) => unit.id !== selectedUnit.id);
    setSelectedUnitId(remaining[0]?.id ?? "");
  }

  return <div className={`view ${styles.page}`}>
    <PageHeader eyebrow="Cierre comercial" title="Ventas" description="Asigná una Unidad existente a un cliente y conservá toda su trazabilidad." action={<button className={`primary-btn ${styles.headAction}`} onClick={() => setCreating(true)} disabled={!availableUnits.length}><Plus size={16} /> Nueva venta</button>} />
    <section className={styles.summary}>
      <MetricCard label="Ventas de hoy" value={formatUsd(revenue)} detail={`${salesToday.length} operaciones registradas`} icon={<CircleDollarSign size={17} />} />
      <MetricCard label="Ganancia estimada" value={formatUsd(profit)} detail="Descontando costo y comisión" icon={<BadgeDollarSign size={17} />} color="var(--green)" />
      <MetricCard label="Comisiones" value={formatUsd(commissions)} detail="Acumulado de vendedores" icon={<Banknote size={17} />} color="var(--violet)" />
      <MetricCard label="Sin cobrar" value={String(sales.filter((sale) => !sale.paid).length)} detail="Unidades con pago pendiente" icon={<Clock3 size={17} />} color="var(--amber)" />
    </section>

    <section className="panel">
      <header className="panel-head"><div><span className="eyebrow">Registro comercial</span><h2>Operaciones de venta</h2></div><span className="badge blue">Datos de demostración</span></header>
      <div className={styles.toolbar}>
        <label className={styles.searchWrap}><Search size={15} /><input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar unidad, cliente o vendedor…" /></label>
        <select className="filter" value={status} onChange={(event) => setStatus(event.target.value as SaleStatus | "TODOS")}><option value="TODOS">Todos los estados</option><option value="PENDIENTE">Pendiente</option><option value="PREPARANDO">Preparando</option><option value="EN_REPARTO">En reparto</option><option value="ENTREGADA">Entregada</option></select>
        <span className={styles.count}>{filtered.length} VENTAS</span>
      </div>
      <div className="table-wrap">{filtered.length ? <table><thead><tr><th>Venta</th><th>Unidad</th><th>Cliente</th><th>Vendedor</th><th>Estado</th><th>Pago</th><th>Importe</th><th></th></tr></thead><tbody>{filtered.map((sale) => <tr key={sale.id} onClick={() => setDetail(sale)}><td className="mono">#{sale.id}</td><td className="product-cell"><strong>{sale.product}</strong><small>{sale.unitId} · {sale.code}</small></td><td>{sale.client}</td><td>{sale.seller}</td><td><span className={`badge ${statusClass[sale.status]}`}>{statusLabel[sale.status]}</span></td><td><span className={`${styles.payment} ${!sale.paid ? styles.unpaid : ""}`}>{sale.paid ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{sale.paid ? "Verificado" : "Pendiente"}</span></td><td>{formatUsd(sale.priceUsd)}</td><td><button className={styles.rowAction} onClick={(event) => { event.stopPropagation(); setDetail(sale); }}><Eye size={14} /> Ver</button></td></tr>)}</tbody></table> : <div className={styles.empty}>No hay ventas que coincidan con los filtros.</div>}</div>
    </section>

    {detail && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">Venta #{detail.id}</span><h2>{detail.product}</h2></div><button className={styles.close} onClick={() => setDetail(null)}><X size={20} /></button></header><div className={styles.detailGrid}>{[["Unidad", detail.unitId],["IMEI / código", detail.code],["Estado", <span key="state" className={`badge ${statusClass[detail.status]}`}>{statusLabel[detail.status]}</span>],["Cliente", detail.client],["Vendedor", detail.seller],["Fecha", formatDate(detail.date)],["Precio de venta", formatUsd(detail.priceUsd)],["Comisión", formatUsd(detail.commissionUsd)],["Margen estimado", <span key="margin" className={styles.margin}>{formatUsd(detail.priceUsd - detail.costUsd - detail.commissionUsd)}</span>]].map(([label, value]) => <div className={styles.detailItem} key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className={styles.detailFooter}><div className={styles.acuNote}><Box size={16} /> Esta operación comercial pertenece a {detail.unitId}. La misma identidad continuará durante reparto, entrega y garantía.</div></div></section></div>}

    {creating && <div className={styles.overlay}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">Nueva operación</span><h2>Registrar venta</h2></div><button className={styles.close} onClick={requestClose}><X size={20} /></button></header><form action={createSale} onChange={() => setDirty(true)}><div className={styles.form}><div className={styles.formGrid}><div className={`${styles.field} ${styles.wide}`}><label htmlFor="unit">Unidad disponible</label><select id="unit" value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)} required>{availableUnits.map((unit) => <option value={unit.id} key={unit.id}>{unit.id} · {unit.product} · {unit.code}</option>)}</select></div>{selectedUnit && <div className={`${styles.unitPreview} ${styles.wide}`}><div><strong>{selectedUnit.product}</strong><small>{selectedUnit.variant} · costo {formatUsd(selectedUnit.costUsd)}</small></div><span>{selectedUnit.id}</span></div>}<div className={styles.field}><label htmlFor="client">Cliente</label><select id="client" name="client" defaultValue="" required><option value="" disabled>Seleccionar cliente</option>{clientsMock.map((client) => <option key={client}>{client}</option>)}</select></div><div className={styles.field}><label htmlFor="seller">Vendedor</label><select id="seller" name="seller" defaultValue="" required><option value="" disabled>Seleccionar vendedor</option>{sellersMock.map((seller) => <option key={seller}>{seller}</option>)}</select></div><div className={styles.field}><label htmlFor="price">Precio de venta USD</label><input id="price" name="price" type="number" min="0" step="0.01" required key={selectedUnit?.id} defaultValue={selectedUnit?.suggestedPriceUsd} /></div><div className={styles.field}><label htmlFor="commission">Comisión USD</label><input id="commission" name="commission" type="number" min="0" step="0.01" required defaultValue="0" /></div><div className={styles.field}><label htmlFor="date">Fecha</label><input id="date" name="date" type="date" required defaultValue="2026-08-31" /></div><label className={styles.check}><input type="checkbox" name="paid" /> <span><strong>Pago verificado</strong><br />Marcá esta opción sólo cuando el ingreso esté confirmado.</span></label></div><div className={styles.acuNote}><ShoppingBag size={16} /> La venta utilizará una Unidad existente y la quitará del conjunto de unidades disponibles en stock.</div></div><footer className={styles.actions}><button type="button" className={styles.cancel} onClick={requestClose}>Cancelar</button><button className={`primary-btn ${styles.save}`} type="submit"><Plus size={15} /> Registrar venta</button></footer></form></section></div>}
  </div>;
}
