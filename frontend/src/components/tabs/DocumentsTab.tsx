import { useState, useRef } from 'react'
import { Upload, Trash2, Info } from 'lucide-react'
import { useDocuments } from '../../hooks/useDocuments'
import { useLanguage } from '../../i18n/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import DocumentInfoModal from '../DocumentInfoModal'
import type { Document } from '../../types'

export default function DocumentsTab() {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const { documents, upload, clear, deleteDocument, isClearing } = useDocuments()
  const [dragOver, setDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({ message: t.msgFileTypeNotSupported, type: 'error' })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus({ message: t.msgFileTooLarge, type: 'error' })
      return
    }

    try {
      setUploadStatus({ message: `${t.msgLoading} ${file.name}...`, type: 'loading' })
      const result = await upload(file)
      setUploadStatus({ 
        message: `✓ ${file.name} - ${t.documentsChunks}: ${result.chunks_created}`, 
        type: 'success' 
      })
      setTimeout(() => setUploadStatus(null), 5000)
    } catch (error: any) {
      // Извлекаем детальное сообщение об ошибке из ответа сервера
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setUploadStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setUploadStatus(null), 10000) // Показываем дольше для длинных сообщений
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleClear = async () => {
    if (!confirm(t.msgConfirmClear)) return
    
    try {
      await clear()
      setUploadStatus({ message: `✓ ${t.msgSuccess}`, type: 'success' })
      setTimeout(() => setUploadStatus(null), 5000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setUploadStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setUploadStatus(null), 10000)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`${t.documentsConfirmDelete}\n\n${doc.filename}`)) return
    
    try {
      await deleteDocument(doc.file_hash)
      setUploadStatus({ message: `✓ ${doc.filename} ${t.msgSuccess}`, type: 'success' })
      setTimeout(() => setUploadStatus(null), 5000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setUploadStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setUploadStatus(null), 10000)
    }
  }

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
      return date.toLocaleDateString()
    } catch {
      return '—'
    }
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleString()
    } catch {
      return '—'
    }
  }

  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
      const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
      return dateB - dateA
    })
  }

  return (
    <div className="space-y-5">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-5">{t.documentsTitle}</h2>
        
        <div
          className={`
            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all
            ${dragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-blue-50'}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-2">
            {t.documentsDragDrop} <span className="text-primary underline">{t.documentsSelectFile}</span>
          </p>
          <small className="text-gray-500">{t.documentsSupported}</small>
        </div>

        {uploadStatus && (
          <div className={`
            mt-4 p-3 rounded-lg text-sm
            ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
            ${uploadStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
            ${uploadStatus.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
          `}>
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">{t.documentsUploaded}</h2>
          <button
            onClick={handleClear}
            disabled={isClearing || documents.length === 0}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.documentsClearAll}
          </button>
        </div>

        {/* Desktop Table View */}
        {!isMobile && (
          <div className="overflow-x-auto">
            {documents.length === 0 ? (
              <p className="text-center text-gray-500 py-10">{t.documentsEmpty}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">{t.documentsDate}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">{t.documentsName}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">{t.documentsSize}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">{t.documentsChunks}</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">{t.documentsInfo}</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">{t.documentsDelete}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortDocuments(documents).map((doc, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          <span className="font-medium text-gray-900 truncate max-w-xs" title={doc.filename}>
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatBytes(doc.text_length)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {doc.chunks_count}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => alert(`${doc.filename}\n\n${t.documentsDate}: ${formatDateTime(doc.uploaded_at)}\n${t.documentsChunks}: ${doc.chunks_count}\n${t.documentsSize}: ${formatBytes(doc.text_length)}\nHash: ${doc.file_hash}`)}
                          className="p-2 bg-blue-100 text-primary rounded-lg hover:bg-blue-200 transition-colors"
                          title={t.documentsInfo}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title={t.documentsDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Mobile List View */}
        {isMobile && (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {documents.length === 0 ? (
              <p className="text-center text-gray-500 py-10">{t.documentsEmpty}</p>
            ) : (
              sortDocuments(documents).map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📄</span>
                      <span className="font-semibold text-gray-900 truncate">{doc.filename}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(doc.uploaded_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="p-2 bg-blue-100 text-primary rounded-lg hover:bg-blue-200 transition-colors"
                      title={t.documentsInfo}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title={t.documentsDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Mobile Info Modal */}
      <DocumentInfoModal
        document={selectedDocument!}
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  )
}
