"use client";

import { useApp } from "@/contexts/AppContext";

export default function Logo() {
  const { navigate } = useApp();
  return (
    <button className="brand" onClick={() => navigate("inicio")} aria-label="Ir al inicio">
      <span className="pulse-mark" aria-hidden><i /><i /><i /><i /><i /></span>
      <span>PGL <b>Pulse</b></span>
    </button>
  );
}
