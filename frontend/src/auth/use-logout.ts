import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { apiRequest } from '../services/api'
import { currentUserQueryKey } from './use-current-user'

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiRequest('/api/auth/logout', {
        method: 'POST',
      }),
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: currentUserQueryKey })
      queryClient.setQueryData(currentUserQueryKey, null)
      navigate('/login', { replace: true })
      toast.success('Logged out successfully.')
    },
    onError: () => {
      toast.error('Unable to log out. Please try again.')
    },
  })
}
