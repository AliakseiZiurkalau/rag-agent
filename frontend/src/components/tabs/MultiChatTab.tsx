import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, User, Bot } from 'lucide-react'
import { useMultiChatStore } from '../../store/multiChatStore'
import { useModalStore } from '../../store/modalStore'
import { queryApi } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import ChatSidebar from '../ChatSidebar'

export default function MultiChatTab() {
  const { t } = useLanguage()
  const { getActiveChat, addMessage, clearMessages, setProcessing } = useMultiChatStore()
  const { openModal } = useModalStore()
  const [input, setInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeChat = getActiveChat()

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [activeChat?.messages])

  const handleSend = async () => {
    if (!activeChat) return
    
    const question = input.trim()
    if (!question || activeChat.isProcessing) return

    setInput('')
    setProcessing(activeChat.id, true)
    addMessage(activeChat.id, 'user', question)

    try {
      const response = await queryApi.ask(question)
      addMessage(activeChat.id, 'assistant', response.answer, response.sources)
    } catch (error: any) {
      addMessage(activeChat.id, 'assistant', `Ошибка: ${error.message}`)
    } finally {
      setProcessing(activeChat.id, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    if (!activeChat) return
    if (confirm(t.chatClearConfirm || 'Очистить историю чата?')) {
      clearMessages(activeChat.id)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex h-[calc(100vh-200px)]">
        <ChatSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Выберите или создайте чат</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-semibold">{activeChat.title}</h2>
            <p className="text-sm text-gray-500">
              {activeChat.messages.length} {activeChat.messages.length === 1 ? 'сообщение' : 'сообщений'}
            </p>
          </div>
          <button
            onClick={handleClear}
            disabled={activeChat.messages.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">{t.chatClear || 'Очистить'}</span>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          {activeChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {t.chatWelcome || 'Начните новый диалог'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                {t.chatWelcomeDesc || 'Задайте вопрос по загруженным документам, и я найду ответ в базе знаний'}
              </p>
            </div>
          ) : (
            activeChat.messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">
                        {t.chatSources || 'Источники'} ({message.sources.length}):
                      </p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <button
                            key={idx}
                            onClick={() => openModal(source)}
                            className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            📄 {source.metadata?.source || source.metadata?.web_url || `Источник ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))
          )}

          {activeChat.isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chatPlaceholder || 'Задайте вопрос...'}
              disabled={activeChat.isProcessing}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || activeChat.isProcessing}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-end"
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">{t.chatSend || 'Отправить'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
