import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../api/client'

export const useDocuments = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  })
  
  const documents = data?.documents || []
  const websites = data?.websites || []

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: documentsApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  return {
    documents,
    websites,
    isLoading,
    upload: uploadMutation.mutateAsync,
    clear: clearMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isClearing: clearMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
