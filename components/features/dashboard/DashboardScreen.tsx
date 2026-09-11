"use client";

import { ArrowDownToLine, ArrowRight, BellRing, ChartNoAxesCombined, CircleDollarSign, ClipboardCheck, ClipboardList, PackageSearch, ScanBarcode, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { OPERATIONAL_TIME_ZONE } from "@/lib/dates";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import MetricCard from "@/components/ui/MetricCard/MetricCard";
import { useApp } from "@/contexts/AppContext";
import { formatUsd } from "@/lib/formatters";
import { useProgram } from "@/contexts/ProgramContext";
import styles from "./DashboardScreen.module.css";

const alerts = [
  { icon: ScanBarcode, title: "Unidades sin IMEI", description: "Con un cliente asociado", color: "var(--red)" },
  { icon: PackageSearch, title: "Stock incompleto", description: "Unidades con datos pendientes", color: "var(--amber)" },
  { icon: ClipboardList, title: "Pedidos sin confirmar", description: "Compras pendientes de confirmación", color: "var(--violet)" },
];

function currentGreeting() {
  const hour = Number(new Intl.DateTimeFormat("es-AR", {
    timeZone: OPERATIONAL_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date()));
  if (hour >= 6 && hour <= 12) return "¡Buenos días!";
  if (hour >= 13 && hour <= 19) return "¡Buenas tardes!";
  return "¡Buenas noches!";
}

export default function DashboardScreen() {
  const [greeting, setGreeting] = useState(currentGreeting);
  useEffect(() => {
    const update = () => setGreeting(currentGreeting());
    const interval = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, []);
  const { navigate } = useApp();
  const { sales, orders, today } = useProgram();
  const dailySales = sales.filter(sale => sale.date === today);
  const dailyOrders = orders.filter(order => order.date === today);
  const drafts = dailyOrders.filter(order => order.status === "BORRADOR").length;
  const confirmed = dailyOrders.length - drafts;
  const closed = dailyOrders.filter(order => order.closed).length;
  const total = dailyOrders.reduce((sum, order) => sum + order.merchandiseUsd + order.shippingUsd, 0);

  return <div className={`view ${styles.page}`}>
    <PageHeader title={greeting} />
    <div className={styles.layout}>
      <section className={styles.metrics} aria-label="Resumen del día">
        <MetricCard label="Ventas de hoy" value={formatUsd(dailySales.reduce((sum, sale) => sum + sale.priceUsd, 0))} icon={<CircleDollarSign size={17} />} />
        <MetricCard label="Ganancia" value={formatUsd(dailySales.reduce((sum, sale) => sum + sale.priceUsd - sale.costUsd - sale.commissionUsd, 0))} icon={<ChartNoAxesCombined size={17} />} color="var(--green)" />
        <MetricCard label="Compras" value={formatUsd(total)} icon={<ArrowDownToLine size={17} />} color="var(--violet)" />
      </section>

      <article className={styles.card + " " + styles.purchases}>
        <header className={styles.cardHead}><div><span className={styles.kicker}>Operación del día</span><h2>Compras y pedidos</h2></div><button className={styles.link} onClick={() => navigate("compras")}>Ver compras <ArrowRight size={14} /></button></header>
        <div className={styles.purchaseSummary}>
          <div className={styles.purchaseCount}><strong>{dailyOrders.length}</strong><span>{dailyOrders.length === 1 ? "compra registrada" : "compras registradas"}</span></div>
          <div className={styles.progressSteps}>
            <div><span className={styles.stepIcon}><ClipboardList size={17} /></span><strong>{drafts}</strong><span>Sin confirmar</span></div>
            <div><span className={styles.stepIcon}><ClipboardCheck size={17} /></span><strong>{confirmed}</strong><span>Confirmados</span></div>
            <div><span className={styles.stepIcon}><ArrowDownToLine size={17} /></span><strong>{closed}</strong><span>En historial</span></div>
          </div>
        </div>
        <footer className={styles.purchaseFooter}><span className={styles.statusDot} /><p>{!dailyOrders.length ? "Todavía no hay compras registradas hoy." : drafts ? `${drafts} pedidos creados esperan confirmación.` : "Todos los pedidos del día están confirmados."} <span>El cierre del día se realiza desde Reparto.</span></p><button className={styles.link} onClick={() => navigate("reparto")}>Ir a Reparto <ArrowRight size={14} /></button></footer>
      </article>

      <article className={styles.card + " " + styles.debt}>
        <header className={styles.cardHead}><div><span className={styles.kicker}>Cuenta de proveedores</span><h2>Deuda pendiente</h2></div><Wallet size={20} className={styles.debtIcon} /></header>
        <div className={styles.debtTotal}><strong aria-label="Saldo no disponible">—</strong><span>Total por pagar</span><span className={styles.previewBadge}>Pendiente de calcular</span></div>
        <div className={styles.debtTable}><table><thead><tr><th>Proveedor</th><th>Hoy</th><th>Histórico</th><th>Total</th></tr></thead><tbody><tr><td colSpan={4}>Los saldos aparecerán al registrar los pagos a proveedores.</td></tr></tbody></table></div>
      </article>

      <aside className={styles.card + " " + styles.alerts} aria-labelledby="alerts-title">
        <header className={styles.alertHeader}><span className={styles.bell}><BellRing size={21} /></span><div><span className={styles.kicker}>Seguimiento</span><h2 id="alerts-title">Centro de alertas</h2></div></header>
        <span className={styles.previewBadge}>Vista previa</span>
        <p className={styles.alertIntro}>Los pendientes de tu operación, en un solo lugar.</p>
        <div className={styles.alertList}>{alerts.map(({ icon: Icon, title, description, color }) => <div className={styles.alertItem} key={title} style={{ "--alert-color": color } as React.CSSProperties}><div className={styles.alertItemHead}><Icon size={19} /><strong aria-label="Cantidad pendiente de conectar">—</strong></div><h3>{title}</h3><p>{description}</p></div>)}</div>
        <footer className={styles.alertFooter}><span className={styles.statusDot} />Contadores pendientes de conectar</footer>
      </aside>
    </div>
  </div>;
}
