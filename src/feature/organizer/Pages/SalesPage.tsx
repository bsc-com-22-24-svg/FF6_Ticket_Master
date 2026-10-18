import { CircleDollarSign, Ticket } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import StatCard from '../Components/StatCard';
import { useEvents } from '../hooks/UseEvents';
export default function SalesPage() {
 const {data:events=[],isLoading}=useEvents(); const sold=events.reduce((s,e)=>s+e.ticketsSold,0);
 const revenue=events.reduce((s,e)=>s+e.ticketsSold*e.ticketTypes.reduce((a,t)=>a+t.price,0)/Math.max(e.ticketTypes.reduce((a,t)=>a+t.capacity,0),1),0);
 return <div className="app-shell"><Sidebar/><main className="main-content"><div className="page-wrap"><header className="page-heading"><div><p className="eyebrow">PERFORMANCE</p><h1>Sales</h1><p className="page-subtitle">A quick overview of ticket sales across your events.</p></div></header>{isLoading?<div className="notice">Loading sales…</div>:<><section className="stats-grid stats-grid--two"><StatCard label="Tickets sold" value={sold.toLocaleString()} icon={Ticket} detail="Across all events"/><StatCard label="Estimated revenue" value={`MK${Math.round(revenue).toLocaleString()}`} icon={CircleDollarSign} detail="Based on ticket mix"/></section><section className="panel table-panel"><h2>Sales by event</h2><div className="responsive-table"><table><thead><tr><th>Event</th><th>Status</th><th>Tickets sold</th><th>Capacity</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.status}</td><td>{e.ticketsSold}</td><td>{e.ticketTypes.reduce((s,t)=>s+t.capacity,0)}</td></tr>)}</tbody></table></div></section></>}</div></main></div>;
}
