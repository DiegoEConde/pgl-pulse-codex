"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import { stockMock, type StockUnit } from "@/lib/mock/stock";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./StockScreen.module.css";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

export default function StockScreen() {
  const units = stockMock;
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("TODAS");
  const [category, setCategory] = useState("TODAS");
  const [supplier, setSupplier] = useState("TODOS");
  const [detail, setDetail] = useState<StockUnit | null>(null);

  const stockUnits = units.filter((unit) => unit.state === "STOCK");
  const brands = [...new Set(stockUnits.map((unit) => unit.brand))];
  const categories = [...new Set(stockUnits.map((unit) => unit.category))];
  const suppliers = [...new Set(stockUnits.map((unit) => unit.supplier))];
  const filtered = useMemo(
    () =>
      units.filter((unit) => {
        const text =
          `${unit.id} ${unit.product} ${unit.code} ${unit.variant} ${unit.ram ?? ""} ${unit.color}`.toLowerCase();
        return (
          unit.state === "STOCK" &&
          text.includes(search.toLowerCase()) &&
          (brand === "TODAS" || unit.brand === brand) &&
          (category === "TODAS" || unit.category === category) &&
          (supplier === "TODOS" || unit.supplier === supplier)
        );
      }),
    [units, search, brand, category, supplier],
  );

  return (
    <div className={`view ${layout.page}`}>
      <PageHeader
        title="Stock"
        action={
          <div className={styles.stockTotal}>
            <strong>{stockUnits.length}</strong>
            <span>Dispositivos en stock</span>
          </div>
        }
      />

      <div className={layout.toolbar}>
        <label className={layout.searchWrap}>
          <Search size={15} />
          <input
            className="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto, IMEI, código o color…"
          />
        </label>
        <select
          className="filter"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
        >
          <option value="TODAS">Todas las marcas</option>
          {brands.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className="filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="TODAS">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className="filter"
          aria-label="Filtrar por proveedor"
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
        >
          <option value="TODOS">Todos los proveedores</option>
          {suppliers.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <section className="panel">
        <header className="panel-head">
          <div>
            <span className="eyebrow">ACU · Existencia actual</span>
            <h2>Unidades disponibles</h2>
          </div>
          <span className="badge green">Estado STOCK</span>
        </header>
        <div className="table-wrap">
          {filtered.length ? (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>IMEI / serie</th>
                  <th>Variante</th>
                  <th>Color</th>
                  <th>Pedido de origen</th>
                  <th>Proveedor</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((unit) => (
                  <tr key={unit.id} onClick={() => setDetail(unit)}>
                    <td>
                      <span className={styles.unitId}>{unit.id}</span>
                    </td>
                    <td className="product-cell">
                      <strong>{unit.product}</strong>
                    </td>
                    <td className="mono">{unit.code}</td>
                    <td className="product-cell">
                      <strong>{unit.ram ? unit.ram + " RAM · " + unit.variant + " ROM" : unit.variant}</strong>
                    </td>
                    <td>{unit.color}</td>
                    <td>Pedido #{unit.purchaseOrder}</td>
                    <td>{unit.supplier}</td>
                    <td className={styles.price}><strong>{formatUsd(unit.costUsd)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.empty}>
              No hay unidades que coincidan con los filtros.
            </div>
          )}
        </div>
      </section>

      {detail && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <section className={styles.modal} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <span className="eyebrow">Unidad {detail.id}</span>
                <h2>{detail.product}</h2>
              </div>
              <button className={styles.close} onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </header>
            <div className={styles.detailGrid}>
              {[
                [
                  "Estado",
                  <span key="state" className="badge green">
                    STOCK
                  </span>,
                ],
                ["IMEI / código", detail.code],
                ["Variante", detail.variant],
                ["Color", detail.color],
                ["Costo", formatUsd(detail.costUsd)],
                ["Ingreso a stock", formatDate(detail.receivedAt)],
              ].map(([label, value]) => (
                <div className={styles.detailItem} key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className={styles.body}>
              <div className={styles.bodyTitle}>
                <h3>Trazabilidad</h3>
              </div>
              <div className={styles.timeline}>
                <div className={styles.step}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Pedido #{detail.purchaseOrder}</strong>
                    <small>{detail.supplier} · origen comercial</small>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Recepción confirmada</strong>
                    <small>
                      {formatDate(detail.receivedAt)} · identidad física creada
                    </small>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Disponible en Stock</strong>
                    <small>Lista para ser seleccionada en una venta</small>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
