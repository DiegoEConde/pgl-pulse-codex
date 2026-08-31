"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Boxes, Building2, Info, Pencil, Plus, Search, Store, UsersRound, X, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { catalogConfig, masterDataMock, type CatalogId, type MasterRecord } from "@/lib/mock/masterData";
import styles from "./DataScreen.module.css";

const icons: Record<CatalogId, LucideIcon> = { products: Boxes, suppliers: Building2, clients: UsersRound, sellers: Store };

export default function DataScreen() {
  const [catalogs, setCatalogs] = useState(masterDataMock);
  const [activeCatalog, setActiveCatalog] = useState<CatalogId | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MasterRecord | "new" | null>(null);
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    const records = activeCatalog ? catalogs[activeCatalog] : [];
    return records.filter((record) => `${record.title} ${record.subtitle} ${record.meta}`.toLowerCase().includes(search.toLowerCase()));
  }, [activeCatalog, catalogs, search]);

  function openCatalog(id: CatalogId) { setActiveCatalog(id); setSearch(""); }
  function requestClose() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")) return;
    setEditing(null); setDirty(false);
  }
  function saveRecord(formData: FormData) {
    if (!activeCatalog) return;
    const current = catalogs[activeCatalog];
    const record: MasterRecord = {
      id: editing === "new" ? Math.max(0, ...current.map((item) => item.id)) + 1 : editing!.id,
      title: String(formData.get("title")), subtitle: String(formData.get("subtitle")), meta: String(formData.get("meta")), active: formData.get("active") === "on",
    };
    setCatalogs((all) => ({ ...all, [activeCatalog]: editing === "new" ? [record, ...current] : current.map((item) => item.id === record.id ? record : item) }));
    setEditing(null); setDirty(false);
  }

  if (!activeCatalog) return <div className={`view ${styles.page}`}>
    <PageHeader eyebrow="Datos maestros" title="Datos" description="Información central para Compras, Ventas, Stock y Reparto." />
    <section className={styles.catalogGrid}>{(Object.keys(catalogConfig) as CatalogId[]).map((id) => { const config = catalogConfig[id]; const Icon = icons[id]; const active = catalogs[id].filter((item) => item.active).length; return <button className={styles.catalogCard} key={id} onClick={() => openCatalog(id)}><span className={styles.cardIcon}><Icon size={21} /></span><h2>{config.label}</h2><p>{config.description}</p><span className={styles.cardFooter}><span>ADMINISTRAR →</span><b>{active}</b></span></button>; })}</section>
  </div>;

  const config = catalogConfig[activeCatalog];
  return <div className={`view ${styles.page}`}>
    <PageHeader eyebrow="Datos maestros" title={config.label} description={config.description} />
    <section className={`panel ${styles.catalog}`}>
      <header className={styles.catalogHead}><div className={styles.catalogHeading}><button className={styles.back} onClick={() => setActiveCatalog(null)}><ArrowLeft size={14} /> Volver a Datos</button><span className={styles.breadcrumb}>Datos / <strong>{config.label}</strong></span><div><h2>Catálogo de {config.label.toLowerCase()}</h2><p>Registros locales de demostración</p></div></div><button className={`primary-btn ${styles.newButton}`} onClick={() => { setEditing("new"); setDirty(false); }}><Plus size={15} /> Nuevo {config.singular.toLowerCase()}</button></header>
      <div className={styles.toolbar}><label className={styles.searchWrap}><Search size={15} /><input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${config.label.toLowerCase()}…`} /></label><select className="filter" defaultValue="TODOS"><option value="TODOS">Todos</option><option value="ACTIVOS">Activos</option><option value="INACTIVOS">Inactivos</option></select><span className={styles.count}>{filtered.length} REGISTROS</span></div>
      <div className="table-wrap">{filtered.length ? <table><thead><tr><th>{config.fields[0]}</th><th>{config.fields[1]}</th><th>{config.fields[2]}</th><th>Estado</th><th></th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className={!record.active ? styles.inactive : ""}><td className="product-cell"><strong>{record.title}</strong><small>ID {record.id.toString().padStart(3, "0")}</small></td><td>{record.subtitle}</td><td>{record.meta}</td><td><span className={`badge ${record.active ? "green" : "muted-badge"}`}>{record.active ? "Activo" : "Inactivo"}</span></td><td><button className={styles.rowAction} onClick={() => { setEditing(record); setDirty(false); }}><Pencil size={13} /> Modificar</button></td></tr>)}</tbody></table> : <div className={styles.empty}>No hay registros que coincidan con la búsqueda.</div>}</div>
    </section>

    {editing && <div className={styles.overlay}><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><span className="eyebrow">{editing === "new" ? "Nuevo registro" : `Registro ${editing.id}`}</span><h2>{editing === "new" ? `Nuevo ${config.singular.toLowerCase()}` : `Modificar ${config.singular.toLowerCase()}`}</h2></div><button className={styles.close} onClick={requestClose}><X size={20} /></button></header><form action={saveRecord} onChange={() => setDirty(true)}><div className={styles.form}><div className={styles.field}><label htmlFor="title">{config.fields[0]}</label><input id="title" name="title" required defaultValue={editing === "new" ? "" : editing.title} /></div><div className={styles.field}><label htmlFor="subtitle">{config.fields[1]}</label><input id="subtitle" name="subtitle" required defaultValue={editing === "new" ? "" : editing.subtitle} /></div><div className={styles.field}><label htmlFor="meta">{config.fields[2]}</label><input id="meta" name="meta" required defaultValue={editing === "new" ? "" : editing.meta} /></div><label className={styles.activeCheck}><input type="checkbox" name="active" defaultChecked={editing === "new" || editing.active} /> Registro activo y disponible para nuevas operaciones</label><div className={styles.note}><Info size={15} /> Desactivar conserva el historial asociado. No se eliminan registros maestros desde esta pantalla.</div></div><footer className={styles.actions}><button type="button" className={styles.cancel} onClick={requestClose}>Cancelar</button><button type="submit" className={`primary-btn ${styles.save}`}>Guardar</button></footer></form></section></div>}
  </div>;
}
