import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../authentication'
import { fetchMyKyc, submitKyc, type SubmitKycInput } from '../../../lib/verification'

const KYC_KEY = 'organizer-kyc'

export function useOrganizerKyc() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = [KYC_KEY, user?.id ?? 'anonymous']

  const query = useQuery({
    queryKey,
    queryFn: () => fetchMyKyc(user!.id),
    enabled: Boolean(user),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (input: SubmitKycInput) => submitKyc(user!.id, input),
    onSuccess: (kyc) => {
      queryClient.setQueryData(queryKey, kyc)
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    kyc: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : '',
    saving: mutation.isPending,
    submit: mutation.mutateAsync,
  }
}
