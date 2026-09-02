"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, Plus, Search, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import {
  clientsMock,
  salesMock,
  sellersMock,
  stockUnitsMock,
  type Sale,
  type SaleStatus,
} from "@/lib/mock/sales";
import styles from "./SalesScreen.module.css";

const statusLabel: Record<SaleStatus, string> = {
  PENDIENTE: "Pendiente",
  PREPARANDO: "Preparando",
  EN_REPARTO: "En reparto",
  ENTREGADA: "Entregada",
};

const statusClass: Record<SaleStatus, string> = {
  PENDIENTE: "amber",
  PREPARANDO: "blue",
  EN_REPARTO: "violet",
  ENTREGADA: "green",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

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

  const salesToday = sales.filter((sale) => sale.date === "2026-08-31");

  const filteredHistory = useMemo(
    () =>
      sales
        .filter((sale) => {
          const matches = `${sale.id} ${sale.product} ${sale.code} ${sale.client} ${sale.seller}`
            .toLowerCase()
            .includes(search.toLowerCase());
          return matches && (status === "TODOS" || sale.status === status);
        })
        .slice(0, 10),
    [sales, search, status],
  );

  const buildSaleSummary = (sale: Sale) => [
    {
      name: sale.product,
      unit: sale.unitId,
      unitPrice: sale.priceUsd,
      total: sale.priceUsd,
    },
  ];

  function requestClose() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?"))
      return;
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

  function renderSalesTable(source: Sale[], emptyMessage: string) {
    if (!source.length) return <div className={styles.empty}>{emptyMessage}</div>;

    return (
      <table>
        <thead>
          <tr>
            <th>Venta</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {source.map((sale) => (
            <tr key={sale.id} onClick={() => setDetail(sale)}>
              <td className="mono">#{sale.id}</td>
              <td>{sale.client}</td>
              <td>{formatDate(sale.date)}</td>
              <td>
                <span className={`badge ${statusClass[sale.status]}`}>
                  {statusLabel[sale.status]}
                </span>
              </td>
              <td>{formatUsd(sale.priceUsd)}</td>
              <td>
                <button
                  className={styles.rowAction}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDetail(sale);
                  }}
                >
                  <Eye size={14} /> Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`view ${styles.page}`}>
      <PageHeader
        title="Ventas"
        action={
          <button
            className={`primary-btn ${styles.headAction}`}
            onClick={() => setCreating(true)}
            disabled={!availableUnits.length}
          >
            <Plus size={16} /> Nueva venta
          </button>
        }
      />

      <div className={styles.toolbar}>
        <label className={styles.searchWrap}>
          <Search size={15} />
          <input
            className="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar venta, cliente o unidad…"
          />
        </label>

        <select
          className="filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as SaleStatus | "TODOS")}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PREPARANDO">Preparando</option>
          <option value="EN_REPARTO">En reparto</option>
          <option value="ENTREGADA">Entregada</option>
        </select>
      </div>

      <section className="panel">
        <header className="panel-head">
          <div>
            <span className="eyebrow">Operación de hoy · {formatDate("2026-08-31")}</span>
            <h2>Ventas de hoy</h2>
          </div>
          <span className="badge blue">{salesToday.length} ventas</span>
        </header>

        <div className="table-wrap">
          {renderSalesTable(salesToday, "No hay ventas registradas para el día de hoy.")}
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <div>
            <span className="eyebrow">Historial reciente</span>
            <h2>Historial</h2>
          </div>
          <span className="badge muted-badge">{filteredHistory.length} resultados</span>
        </header>

        <div className="table-wrap">
          {renderSalesTable(
            filteredHistory,
            "Todavía no hay ventas que coincidan con esta búsqueda.",
          )}
        </div>
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
                <h2>Venta #{detail.id}</h2>
              </div>
              <button className={styles.close} onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </header>

            <div className={styles.detailGrid}>
              {[
                ["Cliente", detail.client],
                ["Fecha de venta", formatDate(detail.date)],
                ["Total de la venta", formatUsd(detail.priceUsd)],
                [
                  "Estado de la venta",
                  <span key="state" className={`badge ${statusClass[detail.status]}`}>
                    {statusLabel[detail.status]}
                  </span>,
                ],
              ].map(([label, value]) => (
                <div className={styles.detailItem} key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.detailBody}>
              <h3>Desglose</h3>
              <div className={styles.summaryTableWrap}>
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidad</th>
                      <th>Unitario</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildSaleSummary(detail).map((item) => (
                      <tr key={`${detail.id}-${item.name}`}>
                        <td>{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{formatUsd(item.unitPrice)}</td>
                        <td>{formatUsd(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {creating && (
        <div className={styles.modalOverlay}>
          <section className={styles.modal} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <h2>Registrar venta</h2>
              </div>
              <button className={styles.close} onClick={requestClose}>
                <X size={20} />
              </button>
            </header>

            <form action={createSale} onChange={() => setDirty(true)}>
              <div className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.field} ${styles.wide}`}>
                    <label htmlFor="unit">Unidad disponible</label>
                    <select
                      id="unit"
                      value={selectedUnitId}
                      onChange={(event) => setSelectedUnitId(event.target.value)}
                      required
                    >
                      {availableUnits.map((unit) => (
                        <option value={unit.id} key={unit.id}>
                          {unit.id} · {unit.product} · {unit.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedUnit && (
                    <div className={`${styles.unitPreview} ${styles.wide}`}>
                      <div>
                        <strong>{selectedUnit.product}</strong>
                        <small>
                          {selectedUnit.variant} · costo {formatUsd(selectedUnit.costUsd)}
                        </small>
                      </div>
                      <span>{selectedUnit.id}</span>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label htmlFor="client">Cliente</label>
                    <select id="client" name="client" defaultValue="" required>
                      <option value="" disabled>
                        Seleccionar cliente
                      </option>
                      {clientsMock.map((client) => (
                        <option key={client}>{client}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="seller">Vendedor</label>
                    <select id="seller" name="seller" defaultValue="" required>
                      <option value="" disabled>
                        Seleccionar vendedor
                      </option>
                      {sellersMock.map((seller) => (
                        <option key={seller}>{seller}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="price">Precio de venta USD</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      key={selectedUnit?.id}
                      defaultValue={selectedUnit?.suggestedPriceUsd}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="commission">Comisión USD</label>
                    <input
                      id="commission"
                      name="commission"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue="0"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="date">Fecha de venta</label>
                    <input id="date" name="date" type="date" required defaultValue="2026-08-31" />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="paid">Pago verificado</label>
                    <div className={styles.check}>
                      <input id="paid" name="paid" type="checkbox" defaultChecked />
                      <span>La venta ya fue confirmada y cobrada.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancel} onClick={requestClose}>
                  Cancelar
                </button>
                <button type="submit" className={`primary-btn ${styles.save}`}>
                  Guardar venta
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
