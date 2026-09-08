"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  Box,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import { OPERATIONAL_DATE, usePurchases } from "@/contexts/PurchasesContext";
import {
  suppliersMock,
  type PurchaseOrder,
  type PurchaseStatus,
} from "@/lib/mock/purchases";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./PurchasesScreen.module.css";

const statusClass: Record<PurchaseStatus, string> = {
  BORRADOR: "muted-badge",
  PEDIDO: "amber",
  ENVÍO: "blue",
  RECIBIDO: "green",
};
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

export default function PurchasesScreen() {
  const { todayOrders, orderHistory, addTodayOrder } = usePurchases();
  const orders = [...todayOrders, ...orderHistory];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "TODOS">("TODOS");
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const filterHistoryOrders = (source: PurchaseOrder[]) =>
      source.filter((order) => {
        const matchesText =
          `${order.id} ${order.supplier} ${order.products.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchesText && (status === "TODOS" || order.status === status);
      });
  const filteredToday = todayOrders;
  const filteredHistory = filterHistoryOrders(orderHistory).slice(0, 10);

  const buildOrderSummary = (order: PurchaseOrder) => {
    const totalUnits = order.units || 1;
    const unitCost = order.merchandiseUsd / totalUnits;

    if (order.products.length === 1) {
      return [{
        name: order.products[0],
        units: totalUnits,
        unitCost,
        total: order.merchandiseUsd,
      }];
    }

    const base = Math.floor(totalUnits / order.products.length);
    const remainder = totalUnits % order.products.length;

    return order.products.map((product, index) => {
      const units = base + (index < remainder ? 1 : 0);
      const total = units * unitCost;
      return {
        name: product,
        units,
        unitCost,
        total,
      };
    });
  };

  function requestClose() {
    if (
      dirty &&
      !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")
    )
      return;
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
    addTodayOrder(next);
    setCreating(false);
    setDirty(false);
    setDetail(next);
  }

  function renderOrdersTable(source: PurchaseOrder[], emptyMessage: string) {
    if (!source.length) return <div className={styles.empty}>{emptyMessage}</div>;
    return <table><thead><tr><th>Pedido</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th>Total</th><th></th></tr></thead><tbody>{source.map((order) => <tr key={order.id} onClick={() => setDetail(order)}><td className="mono">#{order.id}</td><td className="product-cell"><strong>{order.supplier}</strong></td><td>{formatDate(order.date)}</td><td><span className={`badge ${statusClass[order.status]}`}>{order.status}</span></td><td>{formatUsd(order.merchandiseUsd + order.shippingUsd)}</td><td><button className={styles.tableButton} onClick={(event) => { event.stopPropagation(); setDetail(order); }}><Eye size={14} /> Ver</button></td></tr>)}</tbody></table>;
  }

  return (
    <div className={`view ${layout.page}`}>
      <PageHeader
        title="Compras"
        action={
          <button
            className={`primary-btn ${styles.headAction}`}
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> Nueva compra
          </button>
        }
      />

      <div className={layout.toolbar}>
        <label className={layout.searchWrap}><Search size={15} /><input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido, proveedor o producto…" /></label>
        <select className="filter" value={status} onChange={(event) => setStatus(event.target.value as PurchaseStatus | "TODOS")}><option value="TODOS">Todos los estados</option><option value="BORRADOR">Borrador</option><option value="PEDIDO">Pedido</option><option value="ENVÍO">En envío</option><option value="RECIBIDO">Recibido</option></select>
      </div>

      <section className="panel">
        <header className="panel-head"><div><span className="eyebrow">Operación del día · {formatDate(OPERATIONAL_DATE)}</span><h2>Pedidos de hoy</h2></div><span className="badge blue">{filteredToday.length} pedidos</span></header>
        <div className="table-wrap">{renderOrdersTable(filteredToday, "No hay pedidos registrados para el día de hoy.")}</div>
      </section>

      <section className="panel">
        <header className="panel-head"><div><span className="eyebrow">Historial reciente</span><h2>Historial</h2></div><span className="badge muted-badge">{filteredHistory.length} resultados</span></header>
        <div className="table-wrap">{renderOrdersTable(filteredHistory, "Todavía no hay pedidos que coincidan con esta búsqueda.")}</div>
      </section>

      {detail && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setDetail(null);
          }}
        >
          <section className={styles.modal} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <h2>Pedido #{detail.id}</h2>
              </div>
              <button className={styles.close} onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </header>
            <div className={styles.detailGrid}>
              {[
                ["Proveedor", detail.supplier],
                ["Fecha del pedido", formatDate(detail.date)],
                ["Total del pedido", formatUsd(detail.merchandiseUsd + detail.shippingUsd)],
              ].map(([label, value]) => (
                <div className={styles.detailItem} key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className={styles.detailBody}>
              <h3>Resumen de lo solicitado</h3>
              <div className={styles.summaryTableWrap}>
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidades</th>
                      <th>Unitario</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildOrderSummary(detail).map((item) => (
                      <tr key={`${detail.id}-${item.name}`}>
                        <td>{item.name}</td>
                        <td>{item.units}</td>
                        <td>{formatUsd(item.unitCost)}</td>
                        <td>{formatUsd(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detail.notes && (
                <div className={styles.acuCallout}>{detail.notes}</div>
              )}
            </div>
          </section>
        </div>
      )}

      {creating && (
        <div className={styles.modalOverlay}>
          <section className={styles.modal} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <h2>Nueva compra</h2>
              </div>
              <button className={styles.close} onClick={requestClose}>
                <X size={20} />
              </button>
            </header>
            <form onChange={() => setDirty(true)} action={createOrder}>
              <div className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="supplier">Proveedor</label>
                    <select
                      id="supplier"
                      name="supplier"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Seleccionar proveedor
                      </option>
                      {suppliersMock.map((supplier) => (
                        <option key={supplier}>{supplier}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="date">Fecha del pedido</label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      required
                      defaultValue={OPERATIONAL_DATE}
                      readOnly
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="product">Producto</label>
                    <input
                      id="product"
                      name="product"
                      required
                      placeholder="Ej. iPhone 16 Pro"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="units">Cantidad de unidades</label>
                    <input
                      id="units"
                      name="units"
                      type="number"
                      min="1"
                      required
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="expectedDate">Recepción estimada</label>
                    <input
                      id="expectedDate"
                      name="expectedDate"
                      type="date"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="merchandise">Costo mercadería USD</label>
                    <input
                      id="merchandise"
                      name="merchandise"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="shipping">Costo envío USD</label>
                    <input
                      id="shipping"
                      name="shipping"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue="0"
                    />
                  </div>
                  <div className={`${styles.field} ${styles.wide}`}>
                    <label htmlFor="notes">Observaciones</label>
                    <textarea
                      id="notes"
                      name="notes"
                      placeholder="Condiciones, seguimiento o información relevante…"
                    />
                  </div>
                </div>
                <div className={styles.formNote}>
                  <ArrowDownToLine size={17} /> El pedido se guardará como
                  borrador. Las unidades físicas se crearán recién al registrar
                  la recepción.
                </div>
              </div>
              <footer className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={requestClose}
                >
                  Cancelar
                </button>
                <button type="submit" className={`primary-btn ${styles.save}`}>
                  <Plus size={15} /> Crear borrador
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
