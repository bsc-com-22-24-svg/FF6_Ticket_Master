import type { EventInput, EventItem } from '../types/Event';
const KEY = 'ticket-master-organizer-events';
const seed: EventItem[] = [
 { id:'campus-tech-2026', name:'Campus Tech Summit 2026', description:'A gathering for students and technology enthusiasts.', date:'2026-11-14', time:'09:00', location:'University of Malawi, Great Hall', category:'Technology', status:'Published', ticketsSold:214, checkedIn:0, ticketTypes:[{id:'general',name:'General Admission',price:15000,capacity:250},{id:'vip',name:'VIP',price:30000,capacity:100}], weeklySales:[8,13,11,23,17,31,25] },
 { id:'creative-arts-night', name:'Creative Arts Night', description:'An evening celebrating local art, music and performance.', date:'2026-12-02', time:'18:30', location:'Zomba Community Centre', category:'Arts & Culture', status:'Draft', ticketsSold:0, checkedIn:0, ticketTypes:[{id:'arts-general',name:'General Admission',price:5000,capacity:180}], weeklySales:[0,0,0,0,0,0,0] }
];
function read(): EventItem[] { const value = localStorage.getItem(KEY); if (value) { try { return JSON.parse(value) as EventItem[]; } catch {} } localStorage.setItem(KEY, JSON.stringify(seed)); return seed; }
function write(events: EventItem[]) { localStorage.setItem(KEY, JSON.stringify(events)); }
export async function getEvents() { return read(); }
export async function getEvent(id: string) { return read().find(e => e.id === id); }
export async function saveEvent(input: EventInput): Promise<EventItem> {
 const all = read(); const old = input.id ? all.find(e => e.id === input.id) : undefined;
 const saved: EventItem = { ...input, id: old?.id ?? input.id ?? `event-${Date.now()}`, ticketsSold: old?.ticketsSold ?? 0, checkedIn: old?.checkedIn ?? 0, weeklySales: old?.weeklySales ?? [0,0,0,0,0,0,0] };
 write(old ? all.map(e => e.id === saved.id ? saved : e) : [saved, ...all]); return saved;
}
export async function getDashboardStats(id: string) {
 const e = await getEvent(id); if (!e) return {ticketsSold:0,capacity:0,remaining:0,revenue:0,checkedIn:0};
 const capacity = e.ticketTypes.reduce((s,t)=>s+t.capacity,0);
 const averagePrice = e.ticketTypes.reduce((s,t)=>s+t.price,0) / Math.max(capacity,1);
 return {ticketsSold:e.ticketsSold,capacity,remaining:Math.max(0,capacity-e.ticketsSold),revenue:Math.round(e.ticketsSold*averagePrice),checkedIn:e.checkedIn};
}
