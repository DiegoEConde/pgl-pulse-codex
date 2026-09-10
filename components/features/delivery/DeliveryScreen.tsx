"use client";
import { useState } from "react";
import { PackageCheck, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useProgram } from "@/contexts/ProgramContext";
import { useOperation } from "@/hooks/useOperation";
import { runOperation } from "@/lib/supabase/operations";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/formatters";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "@/components/features/purchases/PurchasesScreen.module.css";

export default function DeliveryScreen() {
  const { raw, sales, orders, today } = useProgram();
  const { busy, error, run } = useOperation();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const clients = new Map(raw.clients.map(client => [client.id, client]));
  const pending = sales.filter(sale => sale.status === "REPARTO");
  const filtered = pending.filter(sale => {
    const client = clients.get(sale.clientId);
    return `${sale.unitId} ${sale.client} ${sale.product} ${client?.direccion ?? ""} ${client?.localidad ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });
  const delivered = sales.filter(sale => sale.status === "ENTREGADA").sort((a,b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? "")).slice(0,10);
  const openOrders = orders.filter(order => order.date === today && !order.closed);
  return <div className={`view ${layout.page}`}>
    <PageHeader title="Reparto" description="Unidades vendidas pendientes de entrega y cierre de pedidos del día." action={<span className="badge violet">{pending.length} por entregar</span>} />
    {error && <p role="alert" className="operation-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className={layout.toolbar}><label className={layout.searchWrap}><Search size={15} /><input className="search" aria-label="Buscar reparto" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, unidad o dirección…" /></label></div>
    <section className="panel"><header className="panel-head"><h2>Entregas pendientes</h2><span className="badge blue">{filtered.length} unidades</span></header><div className="table-wrap">{filtered.length ? <table><thead><tr><th>Unidad</th><th>Producto</th><th>Cliente</th><th>Dirección</th><th>Teléfono</th><th>Pago</th><th>Acciones</th></tr></thead><tbody>{filtered.map(sale => {
      const client = clients.get(sale.clientId);
      return <tr key={sale.id}><td className="mono">{sale.unitId}</td><td>{sale.product}<small className="record-note">{sale.code || "Sin código"}</small></td><td>{sale.client}</td><td>{client?.direccion || "Sin dirección"}<small className="record-note">{client?.localidad}</small></td><td>{client?.telefono || "—"}</td><td>{sale.paid ? "Verificado" : "Pendiente"}<small className="record-note">{formatUsd(sale.priceUsd)}</small></td><td><div className="row-actions">{!sale.paid && <button className={styles.cancel} disabled={busy} onClick={() => void run(() => runOperation("pgl_set_payment", { p_id: sale.id, p_paid: true }))}>Verificar pago</button>}<button className={styles.tableButton} disabled={busy} onClick={() => void run(() => runOperation("pgl_deliver", { p_id: sale.id }), () => setNotice("Entrega registrada."))}><PackageCheck size={15} /> Confirmar entrega</button></div></td></tr>;
    })}</tbody></table> : <div className={styles.empty}>No hay entregas pendientes que coincidan.</div>}</div></section>
    <section className="panel"><header className="panel-head"><div><span className="eyebrow">{formatDate(today)}</span><h2>Cierre de pedidos del día</h2></div><button className={styles.cancel} disabled={busy || !openOrders.length} onClick={() => void run(() => runOperation("pgl_close_day", { p_date: today }), count => setNotice(`${count} pedidos enviados al historial.`))}>Finalizar pedidos del día</button></header><div className={styles.detailBody}><p>{openOrders.length} pedidos abiertos de hoy. El cierre los envía al historial y conserva su estado de recepción.</p></div></section>
    <section className="panel"><header className="panel-head"><h2>Últimas entregas</h2></header><div className="table-wrap">{delivered.length ? <table><thead><tr><th>Unidad</th><th>Cliente</th><th>Entrega</th><th>Pago</th></tr></thead><tbody>{delivered.map(sale => <tr key={sale.id}><td>{sale.unitId}</td><td>{sale.client}</td><td>{formatDate(sale.deliveredAt)}</td><td>{sale.paid ? "Verificado" : "Pendiente"}</td></tr>)}</tbody></table> : <div className={styles.empty}>Todavía no hay entregas registradas.</div>}</div></section>
  </div>;
}
