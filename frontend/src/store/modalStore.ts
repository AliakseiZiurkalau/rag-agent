import { create } from 'zustand'
import type { Source } from '../types'

interface ModalState {
  isOpen: boolean
  source: Source | null
  currentChunkIndex: number
  openModal: (source: Source) => void
  closeModal: () => void
  nextChunk: () => void
  prevChunk: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  source: null,
  currentChunkIndex: 0,
  
  openModal: (source) => set({ isOpen: true, source, currentChunkIndex: 0 }),
  
  closeModal: () => set({ isOpen: false, source: null, currentChunkIndex: 0 }),
  
  nextChunk: () => set((state) => {
    if (!state.source) return state
    const maxIndex = state.source.chunks.length - 1
    return {
      currentChunkIndex: Math.min(state.currentChunkIndex + 1, maxIndex)
    }
  }),
  
  prevChunk: () => set((state) => ({
    currentChunkIndex: Math.max(state.currentChunkIndex - 1, 0)
  })),
}))
