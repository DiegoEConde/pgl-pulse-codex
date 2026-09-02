"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { purchaseOrdersMock, type PurchaseOrder } from "@/lib/mock/purchases";

export const OPERATIONAL_DATE = "2026-08-31";

type PurchasesContextValue = {
  todayOrders: PurchaseOrder[];
  orderHistory: PurchaseOrder[];
  addTodayOrder: (order: PurchaseOrder) => void;
  finalizeDailyOrders: () => void;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [todayOrders, setTodayOrders] = useState(() => purchaseOrdersMock.filter((order) => order.date === OPERATIONAL_DATE));
  const [orderHistory, setOrderHistory] = useState(() => purchaseOrdersMock.filter((order) => order.date !== OPERATIONAL_DATE));

  function finalizeDailyOrders() {
    setOrderHistory((history) => [...todayOrders, ...history].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
    setTodayOrders([]);
  }

  return <PurchasesContext.Provider value={{ todayOrders, orderHistory, addTodayOrder: (order) => setTodayOrders((current) => [order, ...current]), finalizeDailyOrders }}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const value = useContext(PurchasesContext);
  if (!value) throw new Error("usePurchases requiere PurchasesProvider");
  return value;
}
