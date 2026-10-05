"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardCopy, Route, X } from "lucide-react";
import SupplierDeliveries from "./SupplierDeliveries";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useProgram } from "@/contexts/ProgramContext";
import { buildDeliveryGroups, buildPendingOrders, formatDeliveryMessage } from "@/lib/delivery";
import { runOperation, operationError } from "@/lib/supabase/operations";
import { formatUsd } from "@/lib/formatters";
import { memoryLabel } from "@/lib/purchase-details";
import { formatDate } from "@/lib/dates";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./DeliveryScreen.module.css";

export default function DeliveryScreen() {
  const { raw, sales, today, loading, refresh } = useProgram();
  const source = useMemo(() => buildDeliveryGroups(raw), [raw]);
  const pending = useMemo(() => buildPendingOrders(raw), [raw]);
  const [order, setOrder] = useState<number[]>([]); const [selectedId, setSelectedId] = useState<number | null>(null);
  const [courierBySupplier, setCourierBySupplier] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({}); const [step, setStep] = useState<"receive" | "pay">("receive");
  const [amount, setAmount] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const [pendingOpen, setPendingOpen] = useState(false); const [modalError, setModalError] = useState("");
  const [routeCourier, setRouteCourier] = useState(""); const [routeCash, setRouteCash] = useState("0");
  const [routeReturns, setRouteReturns] = useState<Record<number, string>>({}); const [routeNotes, setRouteNotes] = useState<Record<number, string>>({});
  const orderedIds = [...order.filter(id => source.some(group => group.supplierId === id)), ...source.map(group => group.supplierId).filter(id => !order.includes(id))];
  const groups = orderedIds.map(id => source.find(group => group.supplierId === id)).filter((group): group is NonNullable<typeof group> => Boolean(group));
  const courierFor = (group: typeof groups[number]) => courierBySupplier[group.supplierId] ?? String(group.lines[0]?.courierId ?? "");
  const missingCouriers = groups.filter(group => !courierFor(group)).length;
  const routedOrderIds = new Set((raw.routeOrders ?? []).map(item => item.pedido_id));
  const routedUnitIds = new Set((raw.routeUnits ?? []).map(item => item.unidad_id));
  const selectedCourierId = routeCourier ? Number(routeCourier) : null;
  const routeOrders = selectedCourierId ? pending.filter(item => item.courierId === selectedCourierId && !routedOrderIds.has(item.id)) : [];
  const routeSales = selectedCourierId ? sales.filter(sale => sale.status === "REPARTO" && sale.deliveryMode === "REPARTIDOR" && sale.courierId === selectedCourierId && !routedUnitIds.has(sale.id)) : [];
  const activeRoutes = (raw.routes ?? []).filter(route => route.estado === "EN_CURSO");
  const selected = pending.find(item => item.id === selectedId);
  const units = selected?.lines.flatMap(line => Array.from({ length: line.cantidad }, (_, index) => ({ key: `${line.id}-${index}`, line, index }))) ?? [];
  const receiveTotal = units.reduce((sum, unit) => sum + (checked[unit.key] ? unit.line.precio_costo_usd : 0), 0) + (selected ? raw.orders.find(item => item.id === selected.id)?.costo_envio_usd ?? 0 : 0);
  const routeMovementTotal = (routeId: number, type: string) => (raw.routeMovements ?? []).filter(item => item.ruta_id === routeId && item.tipo === type).reduce((sum, item) => sum + item.importe_usd, 0);
  async function generate() { if (missingCouriers) { setNotice("Asigná un repartidor a cada tarjeta antes de generar pedidos."); return; } setBusy(true); setNotice(""); try {
    const orderIds = groups.flatMap(group => group.lines.map(line => line.orderId));
    await Promise.all(groups.flatMap(group => [...new Set(group.lines.map(line => line.orderId))].map(orderId => runOperation("pgl_assign_order_courier", { p_id: orderId, p_courier: courierFor(group) ? Number(courierFor(group)) : null }))));
    const assignedGroups = groups.map(group => {
      const courier = raw.couriers.find(item => String(item.id) === courierFor(group));
      return courier ? { ...group, lines: group.lines.map(line => ({ ...line, courierId: courier.id, courier: courier.nombre })) } : group;
    });
    await navigator.clipboard.writeText(formatDeliveryMessage(assignedGroups));
    await runOperation("pgl_generate_orders", { p_ids: orderIds });
    await refresh(); setNotice("Pedidos generados, asignados y copiados. Ya están pendientes de recepción.");
  } catch (error) { setNotice(operationError(error)); } finally { setBusy(false); } }
  async function createRoute() { if (!selectedCourierId) { setNotice("Seleccioná un repartidor para crear la ruta."); return; } if (!routeOrders.length && !routeSales.length) { setNotice("Ese repartidor no tiene pedidos o ventas pendientes para rutear."); return; } setBusy(true); setNotice(""); try {
    const id = await runOperation("pgl_create_delivery_route", { p_courier: selectedCourierId, p_date: today, p_cash: Number(routeCash || 0), p_order_ids: routeOrders.map(item => item.id), p_unit_ids: routeSales.map(item => item.id), p_request: crypto.randomUUID() });
    setRouteCash("0"); await refresh(); setNotice(`Ruta #${id} creada para ${routeOrders.length} pedidos y ${routeSales.length} entregas.`);
  } catch (error) { setNotice(operationError(error)); } finally { setBusy(false); } }
  async function closeRoute(routeId: number) { setBusy(true); setNotice(""); try {
    const route = activeRoutes.find(item => item.id === routeId);
    const expected = route ? route.dinero_entregado_usd - routeMovementTotal(route.id,"PAGO_PROVEEDOR") + routeMovementTotal(route.id,"COBRO_CLIENTE") : 0;
    const result = await runOperation("pgl_close_delivery_route", { p_id: routeId, p_returned: Number(routeReturns[routeId] ?? String(Math.max(0, expected))), p_notes: routeNotes[routeId] ?? "" });
    const summary = result && typeof result === "object" && !Array.isArray(result) ? result as { expected?: number; returned?: number; difference?: number } : {};
    await refresh(); setNotice(`Ruta #${routeId} rendida. Esperado ${formatUsd(summary.expected ?? 0)} · devuelto ${formatUsd(summary.returned ?? 0)} · diferencia ${formatUsd(summary.difference ?? 0)}.`);
  } catch (error) { setNotice(operationError(error)); } finally { setBusy(false); } }
  async function pay() { if (!selected) return; setBusy(true); setModalError(""); try { const payment = amount === "" ? receiveTotal : Number(amount); await runOperation("pgl_receive_and_pay_order", { p_id: selected.id, p_units: units.filter(unit => checked[unit.key]).map(unit => ({ detalle_id: unit.line.id })), p_amount: payment }); setSelectedId(null); setStep("receive"); setNotice(payment < receiveTotal ? `Pedido #${selected.id} recibido. Deuda: ${formatUsd(receiveTotal - payment)}.` : `Pedido #${selected.id} recibido y abonado.`); await refresh(); } catch (error) { setModalError(operationError(error)); } finally { setBusy(false); } }
  return <div className={`view ${layout.page}`}>
    <PageHeader title="Pedidos" action={<div className={styles.generate}>
      <button className={`primary-btn ${layout.headAction}`} disabled={loading || busy || !groups.length || missingCouriers > 0} onClick={() => void generate()}><ClipboardCopy size={16} />{busy ? "Generando…" : "Generar pedidos"}</button>
      {missingCouriers > 0 && <span>Asigná repartidor a {missingCouriers} tarjeta{missingCouriers === 1 ? "" : "s"}.</span>}
    </div>} />
    {notice && <p role="status">{notice}</p>}<p className={styles.hint}>Arrastrá las tarjetas para elegir el orden antes de generar.</p>
    <SupplierDeliveries groups={groups} loading={loading} couriers={raw.couriers} selectedCouriers={courierBySupplier} onCourierChange={(supplierId,courierId)=>setCourierBySupplier(current=>({ ...current, [supplierId]: courierId }))} onMove={(from,to)=>setOrder(()=>{const next=[...orderedIds];const [item]=next.splice(from,1);next.splice(to,0,item);return next;})} />
    <section className={styles.routes}>
      <header><div><span className="eyebrow">Rutas</span><h2>Salida y rendición</h2></div><span className="badge blue">{activeRoutes.length} abiertas</span></header>
      <div className={styles.routeCreator}>
        <label><span>Repartidor</span><select value={routeCourier} onChange={event=>setRouteCourier(event.target.value)}><option value="">Seleccionar repartidor</option>{raw.couriers.map(courier=><option key={courier.id} value={courier.id}>{courier.nombre}</option>)}</select></label>
        <label><span>Dinero entregado USD</span><input type="number" min="0" step="0.01" value={routeCash} onChange={event=>setRouteCash(event.target.value)} /></label>
        <div className={styles.routePreview}><strong>{routeOrders.length + routeSales.length}</strong><small>{routeOrders.length} pedidos · {routeSales.length} entregas</small></div>
        <button className="primary-btn" disabled={busy || !selectedCourierId || (!routeOrders.length && !routeSales.length)} onClick={()=>void createRoute()}><Route size={16}/>Crear ruta</button>
      </div>
      {activeRoutes.length > 0 && <div className={styles.routeList}>{activeRoutes.map(route=>{
        const courier = raw.couriers.find(item=>item.id===route.repartidor_id)?.nombre ?? "Repartidor";
        const orderCount = (raw.routeOrders ?? []).filter(item=>item.ruta_id===route.id).length;
        const unitCount = (raw.routeUnits ?? []).filter(item=>item.ruta_id===route.id).length;
        const supplierPaid = routeMovementTotal(route.id,"PAGO_PROVEEDOR");
        const clientCollected = routeMovementTotal(route.id,"COBRO_CLIENTE");
        const expected = route.dinero_entregado_usd - supplierPaid + clientCollected;
        return <article key={route.id} className={styles.routeCard}><div><strong>Ruta #{route.id} · {courier}</strong><small>{formatDate(route.fecha)} · {orderCount} pedidos · {unitCount} entregas</small><small>Entregado {formatUsd(route.dinero_entregado_usd)} · Pagado {formatUsd(supplierPaid)} · Cobrado {formatUsd(clientCollected)} · Esperado {formatUsd(expected)}</small></div><label><span>Devuelve USD</span><input type="number" min="0" step="0.01" value={routeReturns[route.id] ?? String(Math.max(0, expected))} onChange={event=>setRouteReturns(current=>({...current,[route.id]:event.target.value}))} /></label><input aria-label={`Notas de ruta ${route.id}`} placeholder="Notas" value={routeNotes[route.id] ?? ""} onChange={event=>setRouteNotes(current=>({...current,[route.id]:event.target.value}))} /><button className={styles.validateButton} disabled={busy} onClick={()=>void closeRoute(route.id)}>Rendir</button></article>;
      })}</div>}
    </section>
    <section className={styles.pending}><button className={styles.pendingToggle} aria-expanded={pendingOpen} onClick={()=>setPendingOpen(open=>!open)}><span>Pedidos sin recepcionar <span className="badge amber">{pending.length}</span></span><ChevronDown className={pendingOpen ? styles.chevronOpen : ""}/></button>{pendingOpen && <div className={styles.pendingCards}>{pending.length ? pending.map(item=><article key={item.id}><div><strong>#{item.id} · {item.supplier} <span className={styles.orderDate}>- {formatDate(item.date)}</span></strong><small>{item.lines.reduce((sum,line)=>sum+line.cantidad,0)} unidades · {formatUsd(item.total)} · {item.courier}</small></div><button className={styles.validateButton} onClick={()=>{setModalError("");setChecked(Object.fromEntries(item.lines.flatMap(line=>Array.from({length:line.cantidad},(_,index)=>[`${line.id}-${index}`,true]))));setSelectedId(item.id);setStep("receive");}}>Validar recepción</button></article>) : <p>No hay recepciones pendientes.</p>}</div>}</section>
    {selected && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Validar pedido ${selected.id}`}><header><div><small>PEDIDO #{selected.id} - {formatDate(selected.date)}</small><h2>{step === "receive" ? "Validar recepción" : "Registrar pago"}</h2></div><button aria-label="Cerrar" onClick={()=>setSelectedId(null)}><X/></button></header>{step === "receive" ? <><p>Desmarcá únicamente las unidades que no llegaron.</p><div className={styles.checkList}>{units.map(unit=><label key={unit.key}><input type="checkbox" checked={checked[unit.key] ?? true} onChange={e=>setChecked(current=>({...current,[unit.key]:e.target.checked}))}/><span><strong>{unit.line.product}</strong><small>{[memoryLabel(unit.line.ram,unit.line.rom),unit.line.variant,unit.line.color,`Unidad ${unit.index+1}`].filter(Boolean).join(" · ")}</small></span><b>{formatUsd(unit.line.precio_costo_usd)}</b></label>)}</div><footer><strong>Total a abonar: {formatUsd(receiveTotal)}</strong><button className="primary-btn" disabled={!units.some(unit=>checked[unit.key])} onClick={()=>{setAmount("");setStep("pay");}}>Validar pedido</button></footer></> : <><div className={styles.payBox}><CheckCircle2/><div><span>Total del pedido recibido</span><strong>{formatUsd(receiveTotal)}</strong></div></div><label className={styles.amount}>Importe abonado (USD)<input autoFocus type="number" min="0" max={Math.ceil(receiveTotal)} step="1" value={amount} placeholder={String(Math.round(receiveTotal))} onChange={e=>setAmount(e.target.value.replace(/\D/g,""))}/></label><p>Si dejás el importe vacío, se registrará el pago total.</p>{modalError && <p className="operation-error" role="alert">{modalError}</p>}<footer><button className={styles.backButton} onClick={()=>setStep("receive")}>Volver</button><button className="primary-btn" disabled={busy || Number(amount || receiveTotal)>receiveTotal} onClick={()=>void pay()}>{busy ? "Guardando…" : "Abonar"}</button></footer></>}</section></div>}
  </div>;
}
