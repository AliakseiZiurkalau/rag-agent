import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  isProcessing: boolean
  createdAt: number
  updatedAt: number
}

interface MultiChatStore {
  chats: Chat[]
  activeChat: string | null
  
  // Chat management
  createChat: () => string
  deleteChat: (chatId: string) => void
  setActiveChat: (chatId: string) => void
  renameChat: (chatId: string, title: string) => void
  
  // Message management
  addMessage: (chatId: string, role: 'user' | 'assistant', content: string, sources?: any[]) => void
  clearMessages: (chatId: string) => void
  setProcessing: (chatId: string, isProcessing: boolean) => void
  
  // Getters
  getActiveChat: () => Chat | null
  getChatById: (chatId: string) => Chat | null
}

const generateId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const generateTitle = (firstMessage?: string) => {
  if (!firstMessage) return 'Новый чат'
  const preview = firstMessage.slice(0, 30)
  return preview.length < firstMessage.length ? `${preview}...` : preview
}

export const useMultiChatStore = create<MultiChatStore>((set, get) => {
  // Создаём первый чат при инициализации
  const initialChatId = generateId()
  const initialChat: Chat = {
    id: initialChatId,
    title: 'Новый чат',
    messages: [],
    isProcessing: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  return {
    chats: [initialChat],
    activeChat: initialChatId,

    createChat: () => {
      const newChatId = generateId()
      const newChat: Chat = {
        id: newChatId,
        title: 'Новый чат',
        messages: [],
        isProcessing: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      set(state => ({
        chats: [...state.chats, newChat],
        activeChat: newChatId
      }))
      
      return newChatId
    },

    deleteChat: (chatId: string) => {
      set(state => {
        const newChats = state.chats.filter(chat => chat.id !== chatId)
        
        // Если удаляем активный чат, переключаемся на другой
        let newActiveChat = state.activeChat
        if (state.activeChat === chatId) {
          if (newChats.length > 0) {
            newActiveChat = newChats[newChats.length - 1].id
          } else {
            // Создаём новый чат если удалили последний
            const newChatId = generateId()
            newChats.push({
              id: newChatId,
              title: 'Новый чат',
              messages: [],
              isProcessing: false,
              createdAt: Date.now(),
              updatedAt: Date.now()
            })
            newActiveChat = newChatId
          }
        }
        
        return {
          chats: newChats,
          activeChat: newActiveChat
        }
      })
    },

    setActiveChat: (chatId: string) => {
      set({ activeChat: chatId })
    },

    renameChat: (chatId: string, title: string) => {
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, title, updatedAt: Date.now() }
            : chat
        )
      }))
    },

    addMessage: (chatId: string, role: 'user' | 'assistant', content: string, sources?: any[]) => {
      set(state => ({
        chats: state.chats.map(chat => {
          if (chat.id !== chatId) return chat
          
          const newMessage: Message = {
            role,
            content,
            sources,
            timestamp: Date.now()
          }
          
          const newMessages = [...chat.messages, newMessage]
          
          // Автоматически обновляем название чата по первому сообщению пользователя
          let newTitle = chat.title
          if (role === 'user' && chat.messages.length === 0) {
            newTitle = generateTitle(content)
          }
          
          return {
            ...chat,
            messages: newMessages,
            title: newTitle,
            updatedAt: Date.now()
          }
        })
      }))
    },

    clearMessages: (chatId: string) => {
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: [], title: 'Новый чат', updatedAt: Date.now() }
            : chat
        )
      }))
    },

    setProcessing: (chatId: string, isProcessing: boolean) => {
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, isProcessing }
            : chat
        )
      }))
    },

    getActiveChat: () => {
      const state = get()
      return state.chats.find(chat => chat.id === state.activeChat) || null
    },

    getChatById: (chatId: string) => {
      const state = get()
      return state.chats.find(chat => chat.id === chatId) || null
    }
  }
})
