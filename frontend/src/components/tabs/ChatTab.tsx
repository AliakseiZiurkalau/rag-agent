import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, User, Bot } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useModalStore } from '../../store/modalStore'
import { queryApi } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'

export default function ChatTab() {
  const { t } = useLanguage()
  const { messages, isProcessing, addMessage, clearMessages, setProcessing } = useChatStore()
  const { openModal } = useModalStore()
  const [input, setInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isProcessing) return

    setInput('')
    setProcessing(true)
    addMessage('user', question)

    try {
      const response = await queryApi.ask(question)
      addMessage('assistant', response.answer, response.sources)
    } catch (error: any) {
      addMessage('assistant', `Ошибка: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">{t.chatTitle}</h2>
        <button
          onClick={() => clearMessages()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {t.chatClear}
        </button>
      </div>

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className="h-[500px] overflow-y-auto bg-gray-50 rounded-lg p-5 mb-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <h3 className="text-lg font-semibold mb-2">{t.chatWelcome}</h3>
            <p>{t.chatWelcomeText}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2 font-semibold">
                {message.role === 'user' ? (
                  <>
                    <User className="w-5 h-5 text-primary" />
                    <span className="text-primary">{t.chatYou}</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5 text-green-600" />
                    <span className="text-green-600">{t.chatAssistant}</span>
                  </>
                )}
              </div>
              
              <div className={`
                p-4 rounded-lg shadow-sm whitespace-pre-wrap
                ${message.role === 'user' 
                  ? 'bg-white border-l-4 border-primary' 
                  : 'bg-white border-l-4 border-green-500'
                }
              `}>
                {message.content}
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                  <strong className="block mb-2 text-gray-900">📄 {t.chatSources}</strong>
                  <ul className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <li key={idx} className="flex items-center gap-2 pb-2 border-b border-blue-100 last:border-0">
                        <span>📄</span>
                        <button
                          onClick={() => openModal(source)}
                          className="text-primary hover:text-primary-dark underline font-medium"
                        >
                          {source.filename}
                        </button>
                        <span className="text-gray-600 text-xs">
                          ({source.chunks.length} {t.chatFragment.toLowerCase()}{source.chunks.length > 1 ? 's' : ''})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-2 font-semibold">
              <Bot className="w-5 h-5 text-green-600" />
              <span className="text-green-600">{t.chatAssistant}</span>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                {t.chatProcessing}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chatAskQuestion}
          rows={1}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
