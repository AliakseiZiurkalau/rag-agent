import { useState } from 'react'
import { Save, Trash2, Upload } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { apiProfilesStorage } from '../utils/apiProfiles'
import type { SavedAPIProfile, APIModelConfig } from '../types'

interface APIProfileManagerProps {
  currentConfig: {
    api_type: string
    api_key: string
    api_url: string
    api_model_name: string
  }
  onLoadProfile: (config: APIModelConfig) => void
}

export default function APIProfileManager({ currentConfig, onLoadProfile }: APIProfileManagerProps) {
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState<SavedAPIProfile[]>(apiProfilesStorage.getAll())
  const [profileName, setProfileName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      alert(t.systemSettingsAPIProfileName)
      return
    }

    if (!currentConfig.api_type || !currentConfig.api_key || !currentConfig.api_model_name) {
      alert('Fill all required fields')
      return
    }

    const profile = apiProfilesStorage.save({
      name: profileName.trim(),
      api_type: currentConfig.api_type as any,
      api_key: currentConfig.api_key,
      api_url: currentConfig.api_url || undefined,
      model_name: currentConfig.api_model_name,
    })

    setProfiles(apiProfilesStorage.getAll())
    setProfileName('')
    setShowSaveForm(false)
  }

  const handleLoadProfile = (profile: SavedAPIProfile) => {
    apiProfilesStorage.updateLastUsed(profile.id)
    onLoadProfile(apiProfilesStorage.toConfig(profile))
    setProfiles(apiProfilesStorage.getAll())
  }

  const handleDeleteProfile = (id: string) => {
    if (confirm(`${t.systemSettingsAPIDeleteProfile}?`)) {
      apiProfilesStorage.delete(id)
      setProfiles(apiProfilesStorage.getAll())
    }
  }

  const getAPITypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
      custom: 'Custom',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Save Profile Button */}
      {!showSaveForm && currentConfig.api_type && (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {t.systemSettingsAPISaveProfile}
        </button>
      )}

      {/* Save Form */}
      {showSaveForm && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder={t.systemSettingsAPIProfileName}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t.systemSettingsAPISaveProfile}
            </button>
            <button
              onClick={() => { setShowSaveForm(false); setProfileName('') }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Profiles */}
      {profiles.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">{t.systemSettingsAPISavedProfiles}</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profiles
              .sort((a, b) => {
                // Sort by last_used, then by created_at
                if (a.last_used && b.last_used) {
                  return new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
                }
                if (a.last_used) return -1
                if (b.last_used) return 1
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              })
              .map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{profile.name}</div>
                    <div className="text-sm text-gray-600">
                      {getAPITypeLabel(profile.api_type)} • {profile.model_name}
                    </div>
                    {profile.last_used && (
                      <div className="text-xs text-gray-500">
                        Last used: {new Date(profile.last_used).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleLoadProfile(profile)}
                      className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      {t.systemSettingsAPILoadProfile}
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {profiles.length === 0 && !showSaveForm && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {t.systemSettingsAPINoProfiles}
        </div>
      )}
    </div>
  )
}
