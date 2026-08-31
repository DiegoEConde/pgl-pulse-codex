"use client";

import DashboardScreen from "@/components/features/dashboard/DashboardScreen";
import PurchasesScreen from "@/components/features/purchases/PurchasesScreen";
import SalesScreen from "@/components/features/sales/SalesScreen";
import StockScreen from "@/components/features/stock/StockScreen";
import DataScreen from "@/components/features/data/DataScreen";
import ReportsScreen from "@/components/features/reports/ReportsScreen";
import ModulePlaceholder from "@/components/ui/ModulePlaceholder/ModulePlaceholder";
import { useApp } from "@/contexts/AppContext";

const pending = {
  reparto: ["Reparto", "Planificación de rutas y seguimiento de unidades en entrega."],
} as const;

export default function ScreenRouter() {
  const { currentPage } = useApp();
  if (currentPage === "inicio") return <DashboardScreen />;
  if (currentPage === "compras") return <PurchasesScreen />;
  if (currentPage === "ventas") return <SalesScreen />;
  if (currentPage === "stock") return <StockScreen />;
  if (currentPage === "datos") return <DataScreen />;
  if (currentPage === "reportes") return <ReportsScreen />;
  const [title, description] = pending[currentPage];
  return <div className="view"><ModulePlaceholder title={title} description={description} /></div>;
}
