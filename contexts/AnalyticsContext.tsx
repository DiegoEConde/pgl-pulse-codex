"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useProgram } from "./ProgramContext";
import { useOperation } from "@/hooks/useOperation";
import { getSupabase } from "@/lib/supabase/client";
import type { ReportConfig } from "@/types/analytics";

type Value = { charts: ReportConfig[]; busy: boolean; error: string; addChart: (chart: Omit<ReportConfig,"id">) => Promise<boolean>; removeChart: (id: string) => Promise<boolean> };
const Context = createContext<Value | null>(null);
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { raw } = useProgram();
  const { busy, error, run } = useOperation();
  const charts: ReportConfig[] = raw.charts.map(chart => ({ id: chart.id, title: chart.title, dimension: chart.dimension as ReportConfig["dimension"], metric: chart.metric as ReportConfig["metric"], chartType: chart.chart_type as ReportConfig["chartType"], state: chart.state }));
  async function addChart(chart: Omit<ReportConfig,"id">) {
    return run(async () => {
      const { error } = await getSupabase().from("reporte_config").insert({ title: chart.title.trim(), dimension: chart.dimension, metric: chart.metric, chart_type: chart.chartType, state: chart.state });
      if (error) throw error;
    });
  }
  async function removeChart(id: string) {
    return run(async () => {
      const { error } = await getSupabase().from("reporte_config").delete().eq("id",id);
      if (error) throw error;
    });
  }
  return <Context.Provider value={{ charts, busy, error, addChart, removeChart }}>{children}</Context.Provider>;
}
export function useAnalytics() { const value = useContext(Context); if (!value) throw new Error("useAnalytics requiere AnalyticsProvider"); return value; }
