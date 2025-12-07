import { Trash2 } from 'lucide-react'

interface ModelDownloadItemProps {
  modelName: string
  size?: number
  isDownloading?: boolean
  downloadProgress?: {
    status: string
    percent: number
    completed?: number
    total?: number
  }
  onDelete: (modelName: string) => void
}

export default function ModelDownloadItem({
  modelName,
  size,
  isDownloading,
  downloadProgress,
  onDelete
}: ModelDownloadItemProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const formatDownloadStatus = () => {
    if (!downloadProgress) return ''
    
    if (downloadProgress.completed && downloadProgress.total) {
      const completedGB = downloadProgress.completed / (1024 * 1024 * 1024)
      const totalGB = downloadProgress.total / (1024 * 1024 * 1024)
      return `${completedGB.toFixed(1)} / ${totalGB.toFixed(1)} GB`
    }
    
    return downloadProgress.status
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">{modelName}</span>
          {size && !isDownloading && (
            <span className="text-xs text-gray-500 whitespace-nowrap">({formatSize(size)})</span>
          )}
        </div>

        {isDownloading && downloadProgress && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="truncate">{formatDownloadStatus()}</span>
              <span className="ml-2 whitespace-nowrap">{downloadProgress.percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isDownloading && (
        <button
          onClick={() => onDelete(modelName)}
          className="ml-3 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Удалить модель"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
