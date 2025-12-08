import { Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useMultiChatStore } from '../store/multiChatStore'

export default function ChatSidebar() {
  const { chats, activeChat, createChat, deleteChat, setActiveChat, renameChat } = useMultiChatStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleCreateChat = () => {
    createChat()
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (chats.length === 1) {
      alert('Нельзя удалить последний чат')
      return
    }
    if (confirm('Удалить этот чат?')) {
      deleteChat(chatId)
    }
  }

  const startEditing = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(chatId)
    setEditTitle(currentTitle)
  }

  const saveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(chatId, editTitle.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} д назад`
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleCreateChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Новый чат</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className={`
              p-3 border-b border-gray-200 cursor-pointer transition-colors
              ${activeChat === chat.id ? 'bg-blue-50 border-l-4 border-l-primary' : 'hover:bg-gray-100'}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(chat.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); saveEdit(chat.id) }}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </h3>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {chat.messages.length} сообщений
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(chat.updatedAt)}
                  </p>
                </div>
              </div>

              {editingId !== chat.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => startEditing(chat.id, chat.title, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                    title="Переименовать"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Удалить"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-100">
        <p className="text-xs text-gray-600 text-center">
          Всего чатов: {chats.length}
        </p>
      </div>
    </div>
  )
}
