import { X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Document } from '../types'

interface DocumentInfoModalProps {
  document: Document
  isOpen: boolean
  onClose: () => void
}

export default function DocumentInfoModal({ document, isOpen, onClose }: DocumentInfoModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleString()
    } catch {
      return '—'
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t.documentsInfo}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-700">{t.documentsName}:</div>
            <div className="text-gray-900 break-words">{document.filename}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">{t.documentsDate}:</div>
            <div className="text-gray-900">{formatDate(document.uploaded_at)}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">{t.documentsSize}:</div>
            <div className="text-gray-900">{formatBytes(document.text_length)}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">{t.documentsChunks}:</div>
            <div className="text-gray-900">{document.chunks_count}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">Hash:</div>
            <div className="text-gray-900 font-mono text-xs break-all">{document.file_hash}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
