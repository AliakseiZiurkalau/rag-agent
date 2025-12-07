interface ProgressProps {
  progress: {
    modelName: string
    status: string
    percent: number
    completed?: number
    total?: number
  }
}

export default function ModelDownloadProgress({ progress }: ProgressProps) {
  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">Скачивание: {progress.modelName}</span>
        <span className="text-sm text-primary font-medium">{progress.status}</span>
      </div>
      
      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-300 flex items-center justify-end px-2 text-white text-xs font-semibold"
          style={{ width: `${progress.percent}%` }}
        >
          {progress.percent > 10 && `${progress.percent}%`}
        </div>
      </div>
      
      {progress.completed && progress.total && (
        <div className="text-xs text-gray-600 text-center">
          {formatBytes(progress.completed)} / {formatBytes(progress.total)}
        </div>
      )}
    </div>
  )
}
