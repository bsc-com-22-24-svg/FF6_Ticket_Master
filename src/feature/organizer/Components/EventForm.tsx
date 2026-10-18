import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, UploadCloud } from 'lucide-react';
import type { EventInput, EventItem, EventStatus, TicketType } from '../types/Event';
import Button from './Button';
type Props={initialEvent?:EventItem;onSubmit:(values:EventInput)=>Promise<void>|void;isSaving:boolean};
const ticket=():TicketType=>({id:`ticket-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,name:'General Admission',price:0,capacity:100});
const empty:EventInput={name:'',description:'',date:'',time:'',location:'',category:'Music',status:'Draft',ticketTypes:[ticket()]};
export default function EventForm({initialEvent,onSubmit,isSaving}:Props) {
 const [values,setValues]=useState<EventInput>(empty); const [imageName,setImageName]=useState('');
 useEffect(()=>{if(initialEvent){const {id,name,description,date,time,location,category,imageUrl,status,ticketTypes}=initialEvent;setValues({id,name,description,date,time,location,category,imageUrl,status,ticketTypes:ticketTypes.map(t=>({...t}))});setImageName(imageUrl??'');}else{setValues({...empty,ticketTypes:[ticket()]});setImageName('');}},[initialEvent]);
 function update<K extends keyof EventInput>(key:K,value:EventInput[K]){setValues(old=>({...old,[key]:value}));}
 function updateTicket(id:string,key:keyof TicketType,value:string|number){setValues(old=>({...old,ticketTypes:old.ticketTypes.map(t=>t.id===id?{...t,[key]:value}:t)}));}
 function submit(status:EventStatus){void onSubmit({...values,status});}
 return <form className="event-form" onSubmit={e=>{e.preventDefault();submit('Published');}}>
  <div className="event-form-main">
   <section className="form-card form-section"><div className="form-section-heading"><span className="section-number">01</span><div><h2>Event details</h2><p>Give your event a name and tell people what it is about.</p></div></div>
    <div className="field-grid">
     <label className="field field--full">Event name <b className="required">*</b><input required maxLength={100} value={values.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Campus Tech Summit 2026"/></label>
     <label className="field field--full">Description<textarea rows={4} maxLength={1500} value={values.description} onChange={e=>update('description',e.target.value)} placeholder="What can attendees expect from your event?"/><small>Share details that help people decide to attend.</small></label>
     <label className="field">Category <b className="required">*</b><select required value={values.category} onChange={e=>update('category',e.target.value)}>{['Music','Technology','Arts & Culture','Education','Business','Sports','Community','Other'].map(c=><option key={c}>{c}</option>)}</select></label>
     <label className="field">Location <b className="required">*</b><input required value={values.location} onChange={e=>update('location',e.target.value)} placeholder="Venue or online location"/></label>
     <label className="field">Date <b className="required">*</b><input required type="date" value={values.date} onChange={e=>update('date',e.target.value)}/></label>
     <label className="field">Start time <b className="required">*</b><input required type="time" value={values.time} onChange={e=>update('time',e.target.value)}/></label>
    </div>
   </section>
   <section className="form-card"><div className="form-section-heading"><span className="section-number">02</span><div><h2>Ticket types</h2><p>Set ticket prices and the number available for each type.</p></div></div>
    <div className="ticket-table"><div className="ticket-table-head"><span>Ticket name</span><span>Price (MWK)</span><span>Capacity</span><span/></div>
    {values.ticketTypes.map(t=><div className="ticket-row" key={t.id}><input aria-label="Ticket name" required value={t.name} onChange={e=>updateTicket(t.id,'name',e.target.value)} placeholder="General Admission"/><label className="input-with-prefix"><span>MK</span><input aria-label="Price in MWK" required type="number" min="0" value={t.price} onChange={e=>updateTicket(t.id,'price',Number(e.target.value))}/></label><input aria-label="Ticket capacity" required type="number" min="1" value={t.capacity} onChange={e=>updateTicket(t.id,'capacity',Number(e.target.value))}/><button className="icon-button" type="button" disabled={values.ticketTypes.length===1} onClick={()=>setValues(old=>({...old,ticketTypes:old.ticketTypes.filter(x=>x.id!==t.id)}))} aria-label="Remove ticket type"><Trash2 size={16}/></button></div>)}
    <button className="add-ticket" type="button" onClick={()=>setValues(old=>({...old,ticketTypes:[...old.ticketTypes,{...ticket(),name:''}]}))}><Plus size={16}/> Add ticket type</button></div>
    <div className="capacity-note">Total ticket capacity: <strong>{values.ticketTypes.reduce((s,t)=>s+Number(t.capacity||0),0).toLocaleString()}</strong></div>
   </section>
  </div>
  <aside className="event-form-aside"><section className="publish-card"><div className="form-section-heading"><span className="section-number">03</span><div><h2>Event image</h2><p>Add a banner to help your event stand out.</p></div></div>
   <label className="upload-area"><input type="file" accept="image/*" onChange={e=>setImageName(e.target.files?.[0]?.name??'')}/><ImagePlus size={28}/><strong>{imageName||'Drop your image here, or browse'}</strong><span>PNG or JPG · Upload preview is a demo placeholder</span><span className="upload-browse"><UploadCloud size={16}/> Choose image</span></label>
   <div className="form-actions form-actions--stacked"><Button type="button" variant="secondary" disabled={isSaving} onClick={()=>submit('Draft')}>Save draft</Button><Button type="submit" disabled={isSaving}>{isSaving?'Saving…':'Publish event'} →</Button></div>
  </section></aside>
 </form>;
}
