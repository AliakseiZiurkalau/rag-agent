import { useState } from 'react'
import { Settings, ChevronDown, Globe } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import { useLanguage } from '../i18n/LanguageContext'
import { Language } from '../i18n/translations'

type TabType = 'xwiki' | 'web' | 'documents' | 'chat' | 'settings' | 'telegram'

interface HeaderProps {
  isHealthy: boolean
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
]

export default function Header({ isHealthy, activeTab, onTabChange }: HeaderProps) {
  const { data: stats } = useStats()
  const { language, setLanguage, t } = useLanguage()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  const currentLang = languages.find(l => l.code === language)

  return (
    <header className="bg-white rounded-xl shadow-sm p-4">
      {/* Компактный однострочный header */}
      <div className="flex items-center justify-between gap-4">
        {/* Левая часть: Название + Статус + Модель + Статистика */}
        <div className="flex items-center gap-4">
          {/* Название */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">🤖 {t.appTitle}</h1>
          </div>
          
          {/* Разделитель */}
          <div className="h-8 w-px bg-gray-300" />
          
          {/* Статус системы */}
          <div className="flex items-center gap-2">
            <span className={`text-lg ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>●</span>
            <span className="text-sm font-medium text-gray-700">
              {isHealthy ? t.systemOnline : t.systemOffline}
            </span>
          </div>
          
          {/* Модель */}
          {stats && stats.model && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">🤖</span>
                <span className="text-sm font-medium text-gray-700">{stats.model}</span>
              </div>
            </>
          )}
          
          {/* Статистика */}
          {stats && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span title={`Chunks: ${stats.chunks_count}`}>
                  📄 {t.documentsCount}: {stats.documents_count}
                </span>
                {stats.websites_count > 0 && (
                  <span>🌍 {stats.websites_count}</span>
                )}
                <span>🔍 {t.topK}: {stats.top_k_results}</span>
              </div>
            </>
          )}
        </div>
        
        {/* Правая часть: Кнопки управления */}
        <div className="flex items-center gap-2">
          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">{t.menuSettings}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showSettingsMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowSettingsMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => { onTabChange('xwiki'); setShowSettingsMenu(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${activeTab === 'xwiki' ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    🌐 {t.settingsXWiki}
                  </button>
                  <button
                    onClick={() => { onTabChange('web'); setShowSettingsMenu(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${activeTab === 'web' ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    🌍 {t.settingsWeb}
                  </button>
                  <button
                    onClick={() => { onTabChange('documents'); setShowSettingsMenu(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${activeTab === 'documents' ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    📄 {t.settingsDocuments}
                  </button>
                  <button
                    onClick={() => { onTabChange('telegram'); setShowSettingsMenu(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${activeTab === 'telegram' ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    🤖 Telegram Bot
                  </button>
                  <button
                    onClick={() => { onTabChange('settings'); setShowSettingsMenu(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-primary font-medium' : ''}`}
                  >
                    ⚙️ {t.settingsSystem}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Chat Button */}
          <button
            onClick={() => onTabChange('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'chat'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            💬 {t.menuChat}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{currentLang?.flag}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showLangMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                        language === lang.code ? 'bg-blue-50 text-primary font-medium' : ''
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
