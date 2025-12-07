import { create } from 'zustand'
import type { Message, Source } from '../types'

interface ChatState {
  messages: Message[]
  isProcessing: boolean
  addMessage: (role: 'user' | 'assistant', content: string, sources?: Source[]) => void
  clearMessages: () => void
  setProcessing: (processing: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isProcessing: false,
  
  addMessage: (role, content, sources) => set((state) => ({
    messages: [...state.messages, {
      id: Date.now().toString(),
      role,
      content,
      sources,
      timestamp: new Date(),
    }]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setProcessing: (processing) => set({ isProcessing: processing }),
}))
