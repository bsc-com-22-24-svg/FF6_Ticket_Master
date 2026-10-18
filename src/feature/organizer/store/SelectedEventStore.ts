import { create } from 'zustand';
type State = { selectedEventId: string; setSelectedEventId: (id: string) => void };
export const useSelectedEventStore = create<State>(set => ({ selectedEventId: '', setSelectedEventId: id => set({ selectedEventId: id }) }));
