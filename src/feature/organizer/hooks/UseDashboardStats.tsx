import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/EventsApi';
export function useDashboardStats(id: string) { return useQuery({ queryKey: ['organizer-dashboard-stats', id], queryFn: () => getDashboardStats(id), enabled: Boolean(id) }); }
