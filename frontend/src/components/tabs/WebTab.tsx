import { useState } from 'react'
import { Globe, Download, Trash2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { webApi } from '../../api/client'
import { useDocuments } from '../../hooks/useDocuments'
import { useQueryClient } from '@tanstack/react-query'

export default function WebTab() {
  const { t } = useLanguage()
  const { websites } = useDocuments()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [siteName, setSiteName] = useState('')
  const [maxPages, setMaxPages] = useState(10)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' | 'info' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (!url.trim()) {
      setStatus({ message: t.msgError + ': URL is required', type: 'error' })
      return
    }

    setIsLoading(true)
    setStatus({ message: t.msgLoading + '...', type: 'loading' })

    try {
      const result = await webApi.test({ url, max_pages: maxPages, site_name: siteName })
      setStatus({
        message: `✓ ${result.message}\n${t.documentsTitle}: ${result.title}\n${t.documentsSize}: ${result.content_length} chars`,
        type: 'success'
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setStatus({ message: `✗ ${errorMessage}`, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSite = async (siteName: string) => {
    if (!confirm(`${t.documentsConfirmDelete}\n\n${siteName}`)) return
    
    setIsLoading(true)
    setStatus({ message: `${t.msgLoading}...`, type: 'loading' })
    
    try {
      await webApi.delete(siteName)
      // Обновляем список документов и статистику
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setStatus({ message: `✓ ${siteName} ${t.msgSuccess}`, type: 'success' })
      setTimeout(() => setStatus(null), 5000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setStatus(null), 10000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!url.trim()) {
      setStatus({ message: t.msgError + ': URL is required', type: 'error' })
      return
    }

    if (!confirm(`${t.webImportPages}?\n\n${url}\n${t.webMaxPages}: ${maxPages}`)) {
      return
    }

    setIsLoading(true)
    setStatus({ message: `${t.msgLoading}... (${t.webMaxPages}: ${maxPages})`, type: 'loading' })

    try {
      const result = await webApi.import({ url, max_pages: maxPages, site_name: siteName })
      setStatus({
        message: `✓ ${result.message}\n${t.documentsUploaded}: ${result.imported_count}/${result.total_pages}`,
        type: 'success'
      })
      
      // Очищаем форму после успешного импорта
      setUrl('')
      setSiteName('')
      setMaxPages(10)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || t.msgError
      setStatus({ message: `✗ ${errorMessage}`, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          {t.webTitle}
        </h2>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.webUrl}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.webUrlPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.webSiteName}
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder={t.webSiteNamePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">{t.xwikiOptional}</p>
          </div>

          {/* Max Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.webMaxPages}
            </label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">1-100 pages</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={isLoading || !url.trim()}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              {t.webTestUrl}
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || !url.trim()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t.webImportPages}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className={`
              p-4 rounded-lg text-sm whitespace-pre-line
              ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
              ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
              ${status.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
              ${status.type === 'info' ? 'bg-gray-50 text-gray-700 border border-gray-200' : ''}
            `}>
              {status.message}
            </div>
          )}
        </div>
      </div>

      {/* Imported Websites List */}
      {websites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-5">{t.documentsUploaded}</h2>
          
          <div className="space-y-3">
            {websites
              .sort((a, b) => {
                const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
                const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
                return dateB - dateA
              })
              .map((site, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      {site.site_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t.documentsChunks}: {site.chunks_count} | Pages: {site.pages_count}
                      {site.uploaded_at && ` | ${new Date(site.uploaded_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSite(site.site_name)}
                    disabled={isLoading}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    title={t.documentsDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ {t.xwikiOptional}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• URL must start with http:// or https://</li>
          <li>• The scraper will follow links within the same domain</li>
          <li>• Maximum 100 pages per import</li>
          <li>• Only text content will be extracted (no images)</li>
        </ul>
      </div>
    </div>
  )
}
