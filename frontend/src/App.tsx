import { useState, lazy, Suspense } from 'react'
import Header from './components/Header'
import SourceModal from './components/SourceModal'
import { useHealthCheck } from './hooks/useHealthCheck'
import { LanguageProvider } from './i18n/LanguageContext'

// Lazy loading для оптимизации начальной загрузки
const XWikiTab = lazy(() => import('./components/tabs/XWikiTab'))
const WebTab = lazy(() => import('./components/tabs/WebTab'))
const DocumentsTab = lazy(() => import('./components/tabs/DocumentsTab'))
const ChatTab = lazy(() => import('./components/tabs/ChatTab'))
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'))
const TelegramTab = lazy(() => import('./components/tabs/TelegramTab'))

type TabType = 'xwiki' | 'web' | 'documents' | 'chat' | 'settings' | 'telegram'

// Loading компонент
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const { isHealthy } = useHealthCheck()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <Header 
          isHealthy={isHealthy} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="mt-5">
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'xwiki' && <XWikiTab />}
            {activeTab === 'web' && <WebTab />}
            {activeTab === 'documents' && <DocumentsTab />}
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'telegram' && <TelegramTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </Suspense>
        </main>
      </div>
      
      <SourceModal />
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
