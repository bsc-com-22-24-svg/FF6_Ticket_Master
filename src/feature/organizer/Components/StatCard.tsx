import type { LucideIcon } from 'lucide-react';
export default function StatCard({label,value,detail,icon:Icon}:{label:string;value:string;detail?:string;icon:LucideIcon}) {
 return <article className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={19}/></span></div><strong>{value}</strong>{detail&&<small>{detail}</small>}</article>;
}
