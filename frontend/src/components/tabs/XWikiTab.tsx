import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { xwikiApi } from '../../api/client'
import type { XWikiConfig } from '../../types'
import { useLanguage } from '../../i18n/LanguageContext'

export default function XWikiTab() {
  const { t } = useLanguage()
  const [config, setConfig] = useState<XWikiConfig>({
    base_url: '',
    username: '',
    password: '',
    wiki: 'xwiki',
    space: '',
  })
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null)
  const [spaces, setSpaces] = useState<string[]>([])

  const handleTest = async () => {
    if (!config.base_url) {
      setStatus({ message: t.xwikiUrl, type: 'error' })
      return
    }

    try {
      setStatus({ message: `${t.msgLoading}...`, type: 'loading' })
      const response = await xwikiApi.test(config)
      
      if (response.status === 'success') {
        setStatus({ message: `✓ ${response.message}. ${response.spaces?.length || 0} spaces`, type: 'success' })
        setSpaces(response.spaces || [])
      } else {
        setStatus({ message: `✗ ${response.message}`, type: 'error' })
      }
    } catch (error: any) {
      setStatus({ message: `✗ ${t.msgError}: ${error.message}`, type: 'error' })
    }
  }

  const handleImport = async () => {
    if (!config.base_url) {
      setStatus({ message: t.xwikiUrl, type: 'error' })
      return
    }

    if (!confirm(`${t.xwikiImportPages}?`)) {
      return
    }

    try {
      setStatus({ message: `${t.msgLoading}...`, type: 'loading' })
      const response = await xwikiApi.import(config)
      
      if (response.status === 'success') {
        setStatus({ message: `✓ ${response.message}`, type: 'success' })
      } else {
        setStatus({ message: `⚠ ${response.message}`, type: 'error' })
      }
    } catch (error: any) {
      setStatus({ message: `✗ ${t.msgError}: ${error.message}`, type: 'error' })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
      <h2 className="text-xl font-semibold mb-6">{t.xwikiTitle}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.xwikiUrl}
          </label>
          <input
            type="text"
            value={config.base_url}
            onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
            placeholder="http://localhost:8080/xwiki"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.xwikiUsername}
          </label>
          <input
            type="text"
            value={config.username}
            onChange={(e) => setConfig({ ...config, username: e.target.value })}
            placeholder="admin"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.xwikiPassword}
          </label>
          <input
            type="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            placeholder="password"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.xwikiWiki}
          </label>
          <input
            type="text"
            value={config.wiki}
            onChange={(e) => setConfig({ ...config, wiki: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.xwikiSpace}
          </label>
          <input
            type="text"
            value={config.space}
            onChange={(e) => setConfig({ ...config, space: e.target.value })}
            placeholder="Main"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleTest}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {t.xwikiTestConnection}
          </button>
          <button
            onClick={handleImport}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t.xwikiImportPages}
          </button>
        </div>

        {status && (
          <div className={`
            p-4 rounded-lg text-sm
            ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
            ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
            ${status.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
          `}>
            {status.message}
          </div>
        )}

        {spaces.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-primary mb-3">{t.xwikiAvailableSpaces}</h3>
            <ul className="space-y-2">
              {spaces.map((space, idx) => (
                <li key={idx} className="p-2 bg-white rounded border-l-4 border-primary">
                  {space}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
