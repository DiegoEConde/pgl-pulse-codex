"use client";

import { useMemo, useState } from "react";
import { PackageCheck, Pencil, Search, ShieldCheck, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { formatUsd } from "@/lib/formatters";
import { stockMock, type StockUnit } from "@/lib/mock/stock";
import styles from "./StockScreen.module.css";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

export default function StockScreen() {
  const [units, setUnits] = useState(stockMock);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("TODAS");
  const [category, setCategory] = useState("TODAS");
  const [detail, setDetail] = useState<StockUnit | null>(null);
  const [editing, setEditing] = useState<StockUnit | null>(null);
  const [dirty, setDirty] = useState(false);

  const stockUnits = units.filter((unit) => unit.state === "STOCK");
  const brands = [...new Set(stockUnits.map((unit) => unit.brand))];
  const categories = [...new Set(stockUnits.map((unit) => unit.category))];
  const filtered = useMemo(
    () =>
      units.filter((unit) => {
        const text =
          `${unit.id} ${unit.product} ${unit.code} ${unit.variant} ${unit.color}`.toLowerCase();
        return (
          unit.state === "STOCK" &&
          text.includes(search.toLowerCase()) &&
          (brand === "TODAS" || unit.brand === brand) &&
          (category === "TODAS" || unit.category === category)
        );
      }),
    [units, search, brand, category],
  );

  function requestEditClose() {
    if (
      dirty &&
      !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")
    )
      return;
    setEditing(null);
    setDirty(false);
  }

  function saveUnit(formData: FormData) {
    if (!editing) return;
    const updated: StockUnit = {
      ...editing,
      state: String(formData.get("state")) as StockUnit["state"],
      code: String(formData.get("code")),
      color: String(formData.get("color")),
      costUsd: Number(formData.get("cost")),
      salePriceUsd: Number(formData.get("price")),
    };
    setUnits((current) =>
      current.map((unit) => (unit.id === updated.id ? updated : unit)),
    );
    setDetail(updated.state === "STOCK" ? updated : null);
    setEditing(null);
    setDirty(false);
  }

  return (
    <div className={`view ${styles.page}`}>
      <PageHeader
        eyebrow={`${stockUnits.length} unidades disponibles`}
        title="Stock"
        description="Todas las Unidades físicas cuyo estado actual es STOCK."
      />

      <section className="panel">
        <header className="panel-head">
          <div>
            <span className="eyebrow">ACU · Existencia actual</span>
            <h2>Unidades disponibles</h2>
          </div>
          <span className="badge green">Estado STOCK</span>
        </header>
        <div className={styles.toolbar}>
          <label className={styles.searchWrap}>
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
          <span className={styles.count}>{filtered.length} UNIDADES</span>
        </div>
        <div className="table-wrap">
          {filtered.length ? (
            <table>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Producto</th>
                  <th>IMEI / código</th>
                  <th>Color</th>
                  <th>Origen</th>
                  <th>Precio</th>
                  <th></th>
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
                      <small>
                        {unit.brand} · {unit.variant}
                      </small>
                    </td>
                    <td className="mono">{unit.code}</td>
                    <td>{unit.color}</td>
                    <td className="product-cell">
                      <strong>Pedido #{unit.purchaseOrder}</strong>
                      <small>{unit.supplier}</small>
                    </td>
                    <td className={styles.price}>
                      <strong>{formatUsd(unit.salePriceUsd)}</strong>
                      <small>Costo {formatUsd(unit.costUsd)}</small>
                    </td>
                    <td>
                      <button
                        className={styles.rowAction}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(unit);
                          setDirty(false);
                        }}
                      >
                        <Pencil size={14} /> Modificar
                      </button>
                    </td>
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
        <p className={styles.originNote}>
          <PackageCheck size={14} /> Las altas de unidades se realizan desde la
          recepción de Compras; Stock no crea existencias independientes.
        </p>
      </section>

      {detail && !editing && (
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
                ["Precio sugerido", formatUsd(detail.salePriceUsd)],
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
                <button
                  className={styles.editButton}
                  onClick={() => {
                    setEditing(detail);
                    setDirty(false);
                  }}
                >
                  <Pencil size={13} /> Edición rápida
                </button>
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
              <div className={styles.acuNote}>
                <ShieldCheck size={16} /> La identidad {detail.id} continuará
                sin duplicarse cuando pase a venta, reparto, entrega o garantía.
              </div>
            </div>
          </section>
        </div>
      )}

      {editing && (
        <div className={styles.overlay}>
          <section className={styles.modal} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <span className="eyebrow">Edición rápida · {editing.id}</span>
                <h2>{editing.product}</h2>
              </div>
              <button className={styles.close} onClick={requestEditClose}>
                <X size={20} />
              </button>
            </header>
            <form action={saveUnit} onChange={() => setDirty(true)}>
              <div className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="state">Estado</label>
                    <select id="state" name="state" required defaultValue="">
                      <option value="" disabled>Seleccionar nuevo estado</option>
                      <option value="REPARTO">Reparto</option>
                      <option value="ENTREGADA">Entregada</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="code">IMEI / código</label>
                    <input
                      id="code"
                      name="code"
                      required
                      defaultValue={editing.code}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="color">Color</label>
                    <input
                      id="color"
                      name="color"
                      required
                      defaultValue={editing.color}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="cost">Costo USD</label>
                    <input
                      id="cost"
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={editing.costUsd}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="price">Precio sugerido USD</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={editing.salePriceUsd}
                    />
                  </div>
                </div>
                <div className={styles.acuNote}>
                  <ShieldCheck size={16} /> El estado sólo puede avanzar a
                  Reparto o Entregada. Este cambio no permite retroceder.
                </div>
              </div>
              <footer className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={requestEditClose}
                >
                  Cancelar
                </button>
                <button type="submit" className={`primary-btn ${styles.save}`}>
                  Guardar cambios
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
