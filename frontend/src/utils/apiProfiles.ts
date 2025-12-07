import type { SavedAPIProfile, APIModelConfig } from '../types'

const STORAGE_KEY = 'rag_agent_api_profiles'

export const apiProfilesStorage = {
  getAll(): SavedAPIProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  save(profile: Omit<SavedAPIProfile, 'id' | 'created_at'>): SavedAPIProfile {
    const profiles = this.getAll()
    const newProfile: SavedAPIProfile = {
      ...profile,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    profiles.push(newProfile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    return newProfile
  },

  update(id: string, updates: Partial<SavedAPIProfile>): void {
    const profiles = this.getAll()
    const index = profiles.findIndex(p => p.id === id)
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    }
  },

  delete(id: string): void {
    const profiles = this.getAll().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  },

  updateLastUsed(id: string): void {
    this.update(id, { last_used: new Date().toISOString() })
  },

  toConfig(profile: SavedAPIProfile): APIModelConfig {
    return {
      api_type: profile.api_type,
      api_key: profile.api_key,
      api_url: profile.api_url,
      model_name: profile.model_name,
    }
  },
}
