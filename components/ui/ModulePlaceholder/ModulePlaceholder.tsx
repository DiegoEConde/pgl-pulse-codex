import { Boxes } from "lucide-react";

export default function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="screen-placeholder"><div><span className="screen-placeholder-icon"><Boxes size={25} /></span><h2>{title}</h2><p>{description}</p><small>Estructura lista · pantalla pendiente de definición</small></div></section>;
}
