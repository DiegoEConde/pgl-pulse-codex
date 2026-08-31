"use client";

import { ArrowDownToLine, ArrowRight, Boxes, ChartNoAxesCombined, CircleDollarSign, PackageCheck, Route, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import MetricCard from "@/components/ui/MetricCard/MetricCard";
import { useApp } from "@/contexts/AppContext";
import { formatUsd } from "@/lib/formatters";
import { dashboardMock as data } from "@/lib/mock/dashboard";
import DashboardCharts from "./DashboardCharts";

export default function DashboardScreen() {
  const { navigate } = useApp();
  return <div className="view">
    <PageHeader eyebrow="Centro de mando" title="Buen día, Diego." description="Tu operación, resumida en decisiones claras." />
    <section className="metrics">
      <MetricCard label="Ventas de hoy" value={formatUsd(data.salesToday)} detail="6 unidades entregadas" icon={<CircleDollarSign size={17} />} />
      <MetricCard label="Ganancia" value={formatUsd(data.profitToday)} detail="Margen estimado del día" icon={<ChartNoAxesCombined size={17} />} color="var(--green)" />
      <MetricCard label="Compras" value={formatUsd(data.purchasesToday)} detail="Pedido #421 en tránsito" icon={<ArrowDownToLine size={17} />} color="var(--violet)" />
      <MetricCard label="Unidades activas" value={String(data.stock + data.delivery)} detail={`${data.stock} en stock · ${data.delivery} en ruta`} icon={<Boxes size={17} />} color="var(--cyan)" />
    </section>
    <section className="dashboard-grid">
      <article className="panel">
        <header className="panel-head"><div><span className="eyebrow">ACU · Flujo vivo</span><h2>Movimiento de unidades</h2></div><button className="link-btn" onClick={() => navigate("stock")}>Ver stock <ArrowRight size={14} /></button></header>
        <div className="flow">
          <button className="flow-node" onClick={() => navigate("compras")}><i><ArrowDownToLine size={17} /></i><span><small>Origen</small><span>Compras</span></span><b>4</b></button><i className="connector" />
          <button className="flow-node active" onClick={() => navigate("stock")}><i><Boxes size={17} /></i><span><small>Disponible</small><span>Stock</span></span><b>{data.stock}</b></button><i className="connector" />
          <button className="flow-node" onClick={() => navigate("reparto")}><i><Route size={17} /></i><span><small>En movimiento</small><span>Reparto</span></span><b>{data.delivery}</b></button><i className="connector" />
          <button className="flow-node" onClick={() => navigate("ventas")}><i><PackageCheck size={17} /></i><span><small>Ciclo cerrado</small><span>Entregadas</span></span><b>{data.delivered}</b></button>
        </div>
        <p className="caption">Cada número representa unidades físicas trazables, no cantidades de stock independientes.</p>
      </article>
      <article className="panel">
        <header className="panel-head"><div><span className="eyebrow">Prioridad</span><h2>Requiere atención</h2></div><span className="badge amber">{data.alerts} señales</span></header>
        <div className="attention"><span className="orbit"><b>{data.alerts}</b></span><div><strong>Hay decisiones pendientes</strong><p>Dos unidades esperan asignación y un pedido necesita completar números de serie.</p></div></div>
        <button className="primary-btn" onClick={() => navigate("compras")}>Resolver pendientes <ArrowRight size={15} /></button>
      </article>
    </section>
    <div className="quickbar"><span>Acciones rápidas</span><button onClick={() => navigate("compras")}>＋ Registrar compra</button><button onClick={() => navigate("ventas")}>＋ Nueva venta</button><button onClick={() => navigate("datos")}><Sparkles size={12} /> Administrar datos</button></div>
    <DashboardCharts />
  </div>;
}
