import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useModalStore } from '../store/modalStore'
import { useLanguage } from '../i18n/LanguageContext'

export default function SourceModal() {
  const { t } = useLanguage()
  const { isOpen, source, currentChunkIndex, closeModal, nextChunk, prevChunk } = useModalStore()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeModal])

  if (!isOpen || !source) return null

  const currentChunk = source.chunks[currentChunkIndex]
  const totalChunks = source.chunks.length

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{source.filename}</h2>
          <button
            onClick={closeModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={prevChunk}
              disabled={currentChunkIndex === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.chatPrevious}
            </button>
            
            <span className="font-medium text-gray-700">
              {t.chatFragment} {currentChunkIndex + 1} {t.chatOf} {totalChunks}
            </span>
            
            <button
              onClick={nextChunk}
              disabled={currentChunkIndex === totalChunks - 1}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              {t.chatNext}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-primary font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
            {currentChunk.content}
          </div>
        </div>
      </div>
    </div>
  )
}
