import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../api/client'

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
    refetchInterval: 30000,
  })
}
