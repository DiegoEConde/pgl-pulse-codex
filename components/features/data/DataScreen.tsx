"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Boxes, Building2, Pencil, Plus, Search, Store, UsersRound, X, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { catalogConfig, masterDataMock, type CatalogId, type MasterRecord } from "@/lib/mock/masterData";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./DataScreen.module.css";

const icons: Record<CatalogId, LucideIcon> = { products: Boxes, suppliers: Building2, clients: UsersRound, sellers: Store };

export default function DataScreen() {
  const [catalogs, setCatalogs] = useState(masterDataMock);
  const [activeCatalog, setActiveCatalog] = useState<CatalogId | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MasterRecord | "new" | null>(null);
  const [formError, setFormError] = useState("");
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    const records = activeCatalog ? catalogs[activeCatalog] : [];
    return records.filter((record) => Object.values(record).filter((value) => value !== null).join(" ").toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => b.id - a.id).slice(0, 10);
  }, [activeCatalog, catalogs, search]);

  function openCatalog(id: CatalogId) { setActiveCatalog(id); setSearch(""); }
  function requestClose() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setEditing(null); setDirty(false);
  }
  function saveRecord(formData: FormData) {
    if (!activeCatalog) return;
    const current = catalogs[activeCatalog];
    if (!editing) return;
    const record: MasterRecord = { id: editing === "new" ? Math.max(0, ...current.map((item) => item.id)) + 1 : editing.id, nombre: "" };
    for (const field of catalogConfig[activeCatalog].fields) {
      const value = String(formData.get(field.key) ?? "").trim();
      if (field.required && !value) { setFormError("Completá " + field.label.toLowerCase() + "."); return; }
      record[field.key] = value === "" ? null : field.type === "number" ? Number(value) : value;
    }
    if (activeCatalog === "products" && current.some((item) => item.id !== record.id && item.marca === record.marca && item.nombre === record.nombre)) { setFormError("Ya existe un producto con esa marca y nombre."); return; }
    setFormError("");
    setCatalogs((all) => ({ ...all, [activeCatalog]: editing === "new" ? [record, ...current] : current.map((item) => item.id === record.id ? record : item) }));
    setEditing(null); setDirty(false);
  }

  if (!activeCatalog) return <div className={`view ${layout.page}`}>
    <PageHeader title="Datos" action={<></>} />
    <section className={styles.catalogGrid}>{(Object.keys(catalogConfig) as CatalogId[]).map((id) => { const config = catalogConfig[id]; const Icon = icons[id]; const total = catalogs[id].length; return <button className={styles.catalogCard} key={id} onClick={() => openCatalog(id)}><div className={styles.cardHeading}><span className={styles.cardIcon}><Icon size={21} /></span><h2>{config.label}</h2></div><p>{config.description}</p><span className={styles.cardFooter}><b>{total}</b><span>{total === 1 ? "elemento creado" : "elementos creados"}</span></span></button>; })}</section>
  </div>;

  const config = catalogConfig[activeCatalog];
  return <div className={`view ${layout.page}`}>
    <PageHeader title={config.label} action={
      <div className={styles.headerActions}>
        <button className={`primary-btn ${styles.newButton}`} onClick={() => { setEditing("new"); setDirty(false); setFormError(""); }}><Plus size={16} /> Nuevo {config.singular.toLowerCase()}</button>
      </div>
    } />
    <div className={styles.searchSection}>
      <button className={styles.back} onClick={() => setActiveCatalog(null)}><ArrowLeft size={14} /> Volver a Datos</button>
      <div className={layout.toolbar}>
        <label className={layout.searchWrap}><Search size={15} /><input className="search" aria-label={`Buscar ${config.label.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${config.label.toLowerCase()}…`} /></label>
      </div>
    </div>
    <section className="panel">
      <div className="table-wrap">
        {filtered.length ? <table>
          <thead><tr><th>ID</th>{config.fields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Acciones</th></tr></thead>
          <tbody>{filtered.map((record) => <tr key={record.id}>
            <td className="mono">{record.id}</td>
            {config.fields.map((field) => <td key={field.key} className={field.type === "textarea" ? styles.textCell : undefined}>
              {record[field.key] === null || record[field.key] === undefined ? "—" : field.type === "number" ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(record[field.key])) + " %" : record[field.key]}
            </td>)}
            <td><button className={styles.rowAction} onClick={() => { setEditing(record); setDirty(false); setFormError(""); }}><Pencil size={13} /> Modificar</button></td>
          </tr>)}</tbody>
        </table> : <div className={styles.empty}>No hay registros que coincidan con la búsqueda.</div>}
      </div>
    </section>

    {editing && <div className={styles.overlay}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">{editing === "new" ? "Nuevo registro" : `Registro ${editing.id}`}</span><h2>{editing === "new" ? `Nuevo ${config.singular.toLowerCase()}` : `Modificar ${config.singular.toLowerCase()}`}</h2></div><button className={styles.close} onClick={requestClose}><X size={20} /></button></header><form action={saveRecord} onChange={() => setDirty(true)}><div className={styles.form}>
      {config.fields.map((field) => <div className={styles.field} key={field.key}>
        <label htmlFor={field.key}>{field.label}</label>
        {field.type === "textarea" ? <textarea id={field.key} name={field.key} defaultValue={editing === "new" ? "" : String(editing[field.key] ?? "")} /> :
          <input id={field.key} name={field.key} type={field.type ?? "text"} required={field.required} maxLength={field.maxLength} min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 999.99 : undefined} step={field.type === "number" ? "0.01" : field.type === "time" ? 1 : undefined} defaultValue={editing === "new" ? "" : String(editing[field.key] ?? "")} />}
      </div>)}
      {formError && <p className={styles.formError} role="alert">{formError}</p>}
    </div><footer className={styles.actions}><button type="button" className={styles.cancel} onClick={requestClose}>Cancelar</button><button type="submit" className={`primary-btn ${styles.save}`}>Guardar</button></footer></form></section></div>}
  </div>;
}
