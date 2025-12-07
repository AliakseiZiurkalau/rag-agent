import { useQuery } from '@tanstack/react-query'
import { healthApi } from '../api/client'

export const useHealthCheck = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30000, // Check every 30 seconds
  })

  return {
    isHealthy: data?.status === 'healthy',
    ollamaStatus: data?.ollama,
    isLoading,
  }
}
