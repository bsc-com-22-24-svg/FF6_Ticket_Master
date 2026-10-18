
import { useMemo } from 'react';
import { CalendarCheck, CircleDollarSign, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import StatCard from '../Components/StatCard';
import SalesChart from '../Components/SalesChart';
import ProgressBar from '../Components/ProgressBar';
import Button from '../Components/Button';
import { useEvents } from '../hooks/UseEvents';
import { useDashboardStats } from '../hooks/UseDashboardStats';
import { useSelectedEventStore } from '../store/SelectedEventStore';
export default function OrganizerDashboardPage() {
 const {data:events=[],isLoading,isError}=useEvents();
 const selectedId=useSelectedEventStore(s=>s.selectedEventId); const setSelectedId=useSelectedEventStore(s=>s.setSelectedEventId);
 const selected=useMemo(()=>events.find(e=>e.id===selectedId)??events[0],[events,selectedId]);
 const {data:stats}=useDashboardStats(selected?.id??''); const sold=stats?.ticketsSold??0; const capacity=stats?.capacity??0;
 const sales=selected?.weeklySales??[0,0,0,0,0,0,0];
 return <div className="app-shell"><Sidebar/><main className="main-content"><div className="page-wrap">
  <header className="page-heading dashboard-heading"><div><p className="eyebrow">ORGANIZER WORKSPACE</p><h1>Dashboard</h1><select className="event-inline-select" aria-label="Select event" value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)} disabled={isLoading||!events.length}>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div><Link to="/organizer/events/new"><Button>＋ Create event</Button></Link></header>
  {isLoading&&<div className="notice">Loading dashboard…</div>}{isError&&<div className="notice notice--error">Could not load event data.</div>}
  <section className="stats-grid"><StatCard label="Tickets sold" value={sold.toLocaleString()} icon={Ticket} detail="Tickets purchased"/><StatCard label="Remaining" value={(stats?.remaining??0).toLocaleString()} icon={Users} detail="Tickets available"/><StatCard label="Revenue" value={`MK${(stats?.revenue??0).toLocaleString()}`} icon={CircleDollarSign} detail="Estimated gross sales"/><StatCard label="Checked in" value={(stats?.checkedIn??0).toLocaleString()} icon={CalendarCheck} detail="Validated attendees"/></section>
  <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2>Sales this week</h2><p>Ticket sales across the last seven days</p></div></div><SalesChart values={sales}/></article>
   <article className="panel"><div className="panel-heading"><div><h2>Capacity</h2><p>Ticket availability for this event</p></div></div><ProgressBar label="Sold" value={sold} total={capacity}/><div className="attendance-progress"><div className="progress-label"><span>Attendance (validated)</span><strong>{stats?.checkedIn??0}</strong></div><div className="progress-track"><span className="progress-fill" style={{width:`${sold?Math.min(((stats?.checkedIn??0)/sold)*100,100):0}%`}}/></div><p>Check-in validation becomes available on event day.</p></div></article>
  </section>
 </div></main></div>;
}
