import { ClipboardCheck, Users } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import StatCard from '../Components/StatCard';
import { useEvents } from '../hooks/UseEvents';
export default function AttendancePage() {
 const {data:events=[],isLoading}=useEvents(); const checked=events.reduce((s,e)=>s+e.checkedIn,0); const sold=events.reduce((s,e)=>s+e.ticketsSold,0);
 return <div className="app-shell"><Sidebar/><main className="main-content"><div className="page-wrap"><header className="page-heading"><div><p className="eyebrow">EVENT OPERATIONS</p><h1>Attendance</h1><p className="page-subtitle">Review validated check-ins for your events.</p></div></header>{isLoading?<div className="notice">Loading attendance…</div>:<><section className="stats-grid stats-grid--two"><StatCard label="Checked in" value={checked.toLocaleString()} icon={ClipboardCheck} detail="Validated attendees"/><StatCard label="Tickets sold" value={sold.toLocaleString()} icon={Users} detail="Potential attendees"/></section><section className="panel table-panel"><h2>Attendance by event</h2><div className="responsive-table"><table><thead><tr><th>Event</th><th>Date</th><th>Checked in</th><th>Tickets sold</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.date||'Not set'}</td><td>{e.checkedIn}</td><td>{e.ticketsSold}</td></tr>)}</tbody></table></div><p className="table-note">Live QR validation can be connected to the team's tickets/validation feature.</p></section></>}</div></main></div>;
}
