"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { ReportConfig } from "@/types/analytics";

const initial: ReportConfig[] = [{ id:"sales-category",title:"Ventas por categoría",dimension:"category",metric:"sales",chartType:"bar",state:"ENTREGADA" }];
type Value={charts:ReportConfig[];addChart:(chart:Omit<ReportConfig,"id">)=>void;removeChart:(id:string)=>void};
const Context=createContext<Value|null>(null);
export function AnalyticsProvider({children}:{children:ReactNode}){
  const [charts,setCharts]=useState(initial);
  return <Context.Provider value={{charts,addChart:(chart)=>setCharts((all)=>[...all,{...chart,id:`chart-${Date.now()}`}]),removeChart:(id)=>setCharts((all)=>all.filter((chart)=>chart.id!==id))}}>{children}</Context.Provider>;
}
export function useAnalytics(){const value=useContext(Context);if(!value)throw new Error("useAnalytics requiere AnalyticsProvider");return value;}
