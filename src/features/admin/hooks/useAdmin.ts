import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAdminAuditLogs,
  listAdminEvents,
  listAdminKyc,
  reviewAdminKyc,
  updateAdminEventStatus,
  type AdminEventStatus,
  type ReviewKycInput,
} from '../../../lib/backendAdmin'

const EVENTS_KEY = 'admin-events'
const AUDIT_KEY = 'admin-audit-logs'
const KYC_KEY = 'admin-kyc'
const ORGANIZER_KYC_KEY = 'organizer-kyc'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

export function useAdminEvents(status?: AdminEventStatus) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: [EVENTS_KEY, status ?? 'ALL'],
    queryFn: () => listAdminEvents(status),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: ({
      eventId,
      status: nextStatus,
      reason,
    }: {
      eventId: string
      status: AdminEventStatus
      reason?: string
    }) => updateAdminEventStatus(eventId, nextStatus, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: errorMessage(query.error),
    refetch: query.refetch,
    setStatus: mutation.mutateAsync,
    settingStatus: mutation.isPending,
  }
}

export function useAdminAuditLogs(limit = 100) {
  const query = useQuery({
    queryKey: [AUDIT_KEY, limit],
    queryFn: () => listAdminAuditLogs(limit),
    retry: false,
  })

  return {
    logs: query.data ?? [],
    loading: query.isLoading,
    error: errorMessage(query.error),
    refetch: query.refetch,
  }
}

export function useAdminKyc() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: [KYC_KEY],
    queryFn: listAdminKyc,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: ({ organizerId, input }: { organizerId: string; input: ReviewKycInput }) =>
      reviewAdminKyc(organizerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KYC_KEY] })
      void queryClient.invalidateQueries({ queryKey: [ORGANIZER_KYC_KEY] })
    },
  })

  return {
    submissions: query.data ?? [],
    loading: query.isLoading,
    error: errorMessage(query.error),
    refetch: query.refetch,
    review: mutation.mutateAsync,
    reviewing: mutation.isPending,
  }
}
