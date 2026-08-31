import { formatMetric } from "@/lib/analytics";
import type { ChartDatum, ChartType, Metric } from "@/types/analytics";
import styles from "./AnalyticsChart.module.css";

const colors=["#339cff","#54d5f4","#56d6a3","#9386ff","#f1bd65","#ff7e7e"];
export default function AnalyticsChart({data,type,metric}:{data:ChartDatum[];type:ChartType;metric:Metric}){
  if(!data.length)return <div className={styles.empty}>No hay datos para esta combinación.</div>;
  const max=Math.max(...data.map((item)=>item.value),1);
  if(type==="bar")return <div className={`${styles.chart} ${styles.bars}`}>{data.slice(0,8).map((item)=><div className={styles.bar} key={item.label}><span>{item.label}</span><div className={styles.track}><div className={styles.fill} style={{width:`${item.value/max*100}%`}}/></div><b className={styles.value}>{formatMetric(item.value,metric)}</b></div>)}</div>;
  if(type==="line"){
    const ordered=[...data].reverse().slice(-8);const points=ordered.map((item,index)=>`${20+index*(560/Math.max(ordered.length-1,1))},${190-item.value/max*150}`).join(" ");
    return <div className={styles.chart}><svg className={styles.line} viewBox="0 0 600 220" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#339cff" stopOpacity=".25"/><stop offset="1" stopColor="#339cff" stopOpacity="0"/></linearGradient></defs>{[40,90,140,190].map(y=><line key={y} x1="20" x2="580" y1={y} y2={y} className={styles.lineGrid}/>) }<polygon points={`20,200 ${points} 580,200`} className={styles.lineArea}/><polyline points={points} className={styles.linePath}/>{points.split(" ").map((point,i)=>{const [x,y]=point.split(",");return <circle key={i} cx={x} cy={y} r="4" className={styles.point}/>})}</svg><div className={styles.axisLabels}>{ordered.map((item)=><span key={item.label}>{item.label}</span>)}</div></div>;
  }
  const segments=data.slice(0,6);const total=segments.reduce((sum,item)=>sum+item.value,0);const gradient=segments.map((item,index)=>{const start=segments.slice(0,index).reduce((sum,current)=>sum+current.value,0)/total*100;const end=start+item.value/total*100;return `${colors[index]} ${start}% ${end}%`;}).join(",");
  return <div className={`${styles.chart} ${styles.donutWrap}`}><div className={styles.donut} style={{background:`conic-gradient(${gradient})`}}/><div className={styles.legend}>{data.slice(0,6).map((item,index)=><div className={styles.legendRow} key={item.label}><i style={{background:colors[index]}}/><span>{item.label}</span><b>{formatMetric(item.value,metric)}</b></div>)}</div></div>;
}
