import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignStaffEvents,
  createStaff,
  listStaff,
  removeStaff,
  setStaffActive,
  type CreateStaffInput,
  type StaffMember,
} from '../../../lib/backendStaff'

const STAFF_KEY = ['organizer-staff']

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

function errorStatus(error: unknown): number | undefined {
  return (error as { status?: number } | null)?.status
}

export function useStaff() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: STAFF_KEY,
    queryFn: listStaff,
    retry: false,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: STAFF_KEY })

  const create = useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: refresh,
  })
  const assign = useMutation({
    mutationFn: ({ staffId, eventIds }: { staffId: string; eventIds: string[] }) =>
      assignStaffEvents(staffId, eventIds),
    onSuccess: refresh,
  })
  const toggleActive = useMutation({
    mutationFn: ({ staffId, isActive }: { staffId: string; isActive: boolean }) =>
      setStaffActive(staffId, isActive),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (staffId: string) => removeStaff(staffId),
    onSuccess: refresh,
  })

  const allStaff = useMemo(() => query.data ?? [], [query.data])
  const staff = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allStaff
    return allStaff.filter((member) =>
      [member.name, member.email, ...member.events.map((event) => event.title)]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [allStaff, search])

  return {
    staff,
    allStaff,
    totalStaff: allStaff.length,
    activeStaff: allStaff.filter((member) => member.isActive).length,
    disabledStaff: allStaff.filter((member) => !member.isActive).length,
    search,
    setSearch,
    loading: query.isLoading,
    error: errorMessage(query.error),
    unsupported: errorStatus(query.error) === 404,
    saving:
      create.isPending || assign.isPending || toggleActive.isPending || remove.isPending,
    createStaff: async (input: CreateStaffInput): Promise<StaffMember> => {
      return create.mutateAsync(input)
    },
    assignEvents: async (staffId: string, eventIds: string[]): Promise<StaffMember> => {
      return assign.mutateAsync({ staffId, eventIds })
    },
    setActive: async (staffId: string, isActive: boolean): Promise<StaffMember> => {
      return toggleActive.mutateAsync({ staffId, isActive })
    },
    removeStaff: async (staffId: string): Promise<void> => {
      await remove.mutateAsync(staffId)
    },
  }
}
