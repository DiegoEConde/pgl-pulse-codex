"use client";
import { useState } from "react";
import { ClipboardCopy } from "lucide-react";
import SupplierDeliveries from "./SupplierDeliveries";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import { useProgram } from "@/contexts/ProgramContext";
import { buildDeliveryGroups, formatDeliveryMessage } from "@/lib/delivery";
import layout from "@/components/ui/OperationalLayout.module.css";
import styles from "./DeliveryScreen.module.css";

export default function DeliveryScreen() {
  const { raw, loading } = useProgram();
  const groups = buildDeliveryGroups(raw);
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState("");
  async function copy() {
    setCopying(true); setNotice("");
    try {
      await navigator.clipboard.writeText(formatDeliveryMessage(groups));
      setNotice("Reparto copiado");
    } catch {
      setNotice("No se pudo copiar. Permití el acceso al portapapeles y volvé a intentar.");
    } finally { setCopying(false); }
  }
  return <div className={`view ${layout.page}`}>
    <PageHeader title="Repartos" action={<div className={styles.generate}>
      <button className={`primary-btn ${layout.headAction}`} disabled={loading || copying || !groups.length} onClick={() => void copy()}><ClipboardCopy size={16} />{copying ? "Copiando…" : "Generar reparto"}</button>
      <span>{groups.length} {groups.length === 1 ? "parada" : "paradas"}</span>
      <span role="status" aria-live="polite">{notice}</span>
    </div>} />
    <SupplierDeliveries groups={groups} loading={loading} />
  </div>;
}
