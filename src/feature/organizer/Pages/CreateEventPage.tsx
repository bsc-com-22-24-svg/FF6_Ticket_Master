import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import EventForm from '../Components/EventForm';
import { useEvent, useSaveEvent } from '../hooks/UseEvents';
import { useSelectedEventStore } from '../store/SelectedEventStore';
import type { EventInput } from '../types/Event';
export default function CreateEventPage() {
 const {eventId}=useParams(); const editing=Boolean(eventId); const navigate=useNavigate();
 const {data:event,isLoading,isError}=useEvent(eventId); const save=useSaveEvent(); const setSelected=useSelectedEventStore(s=>s.setSelectedEventId);
 async function handleSubmit(values:EventInput){try{const saved=await save.mutateAsync(values);setSelected(saved.id);navigate('/organizer');}catch{/* Error message shown below. */}}
 return <div className="app-shell"><Sidebar/><main className="main-content"><div className="page-wrap form-page"><header className="page-heading"><div><p className="eyebrow">EVENT MANAGEMENT</p><h1>{editing?'Edit event':'Create event'}</h1><p className="page-subtitle">Fill in the details, set pricing and capacity, then publish.</p></div></header>
 {isLoading&&<div className="notice">Loading event details…</div>}{isError&&<div className="notice notice--error">Could not load this event.</div>}{save.isError&&<div className="notice notice--error">The event could not be saved. Please try again.</div>}
 {(!editing||(!isLoading&&event))&&<EventForm initialEvent={event} onSubmit={handleSubmit} isSaving={save.isPending}/>}
 </div></main></div>;
}
