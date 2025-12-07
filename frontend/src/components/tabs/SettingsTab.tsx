import { useState, useEffect } from 'react'
import { Save, RotateCcw, Link, X, Library, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, modelsApi, apiModelsApi } from '../../api/client'
import type { Settings, APIModelConfig } from '../../types'
import OllamaModelsModal from '../OllamaModelsModal'
import ModelDownloadItem from '../ModelDownloadItem'
import APIProfileManager from '../APIProfileManager'
import { useLanguage } from '../../i18n/LanguageContext'
import { getModelConfig, getCategoryDescription } from '../../config/modelConfigs'

export default function SettingsTab() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get })
  
  const [localSettings, setLocalSettings] = useState<Partial<Settings>>({})
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // API Model Config
  const [apiType, setApiType] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [apiModelName, setApiModelName] = useState('')
  
  // Model Download
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false)
  const [downloadingModels, setDownloadingModels] = useState<Map<string, any>>(new Map())
  const [isModelsListExpanded, setIsModelsListExpanded] = useState(true)

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.list,
  })

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  // Автоматическое обновление параметров при смене модели
  const handleModelChange = (newModel: string) => {
    const modelConfig = getModelConfig(newModel)
    
    setLocalSettings({
      ...localSettings,
      model: newModel,
      temperature: modelConfig.temperature.default,
      num_predict: modelConfig.maxTokens.default,
      num_ctx: modelConfig.contextSize.default,
      context_length: modelConfig.contextLength.default
    })
    
    setStatus({ 
      message: `✓ Параметры настроены для ${modelConfig.displayName}`, 
      type: 'success' 
    })
    setTimeout(() => setStatus(null), 3000)
  }

  // Получаем конфигурацию текущей модели
  const currentModelConfig = getModelConfig(localSettings.model || '')

  const saveMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setStatus({ message: `✓ ${t.systemSettingsSaved}`, type: 'success' })
      setTimeout(() => setStatus(null), 5000)
    },
    onError: (error: any) => {
      setStatus({ message: `✗ ${t.msgError}: ${error.message}`, type: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setStatus({ message: `✓ ${t.msgSuccess}`, type: 'success' })
      setTimeout(() => setStatus(null), 3000)
    },
  })

  const handleSave = () => {
    saveMutation.mutate(localSettings)
  }

  const handleReset = () => {
    setLocalSettings({
      model: 'llama3.2:1b',
      temperature: 0.1,
      num_predict: 80,
      num_ctx: 512,
      context_length: 300,
    })
    setStatus({ message: t.systemSettingsResetToDefaults, type: 'success' })
  }

  const handleDownload = async (modelName: string) => {
    if (!modelName) return

    // Добавляем модель в список загружаемых
    setDownloadingModels(prev => new Map(prev).set(modelName, {
      modelName,
      status: 'Подготовка...',
      percent: 0
    }))

    try {
      const eventSource = new EventSource(`/api/models/download?model_name=${encodeURIComponent(modelName)}`)
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.status === 'complete') {
          setDownloadingModels(prev => {
            const newMap = new Map(prev)
            newMap.set(modelName, { ...data, percent: 100 })
            return newMap
          })
          eventSource.close()
          queryClient.invalidateQueries({ queryKey: ['models'] })
          
          // Удаляем из списка загружаемых через 2 секунды
          setTimeout(() => {
            setDownloadingModels(prev => {
              const newMap = new Map(prev)
              newMap.delete(modelName)
              return newMap
            })
          }, 2000)
        } else if (data.status === 'error') {
          setStatus({ message: `✗ ${data.message}`, type: 'error' })
          eventSource.close()
          setDownloadingModels(prev => {
            const newMap = new Map(prev)
            newMap.delete(modelName)
            return newMap
          })
        } else {
          const percent = data.completed && data.total 
            ? Math.round((data.completed / data.total) * 100)
            : 0
          setDownloadingModels(prev => {
            const newMap = new Map(prev)
            newMap.set(modelName, { ...data, percent, completed: data.completed, total: data.total })
            return newMap
          })
        }
      }

      eventSource.onerror = () => {
        setStatus({ message: '✗ Ошибка загрузки модели', type: 'error' })
        eventSource.close()
        setDownloadingModels(prev => {
          const newMap = new Map(prev)
          newMap.delete(modelName)
          return newMap
        })
      }
    } catch (error: any) {
      setStatus({ message: `✗ Ошибка: ${error.message}`, type: 'error' })
      setDownloadingModels(prev => {
        const newMap = new Map(prev)
        newMap.delete(modelName)
        return newMap
      })
    }
  }

  const handleConfigureAPI = async () => {
    if (!apiType || !apiKey || !apiModelName) {
      setStatus({ message: 'Заполните все обязательные поля', type: 'error' })
      return
    }

    const config: APIModelConfig = {
      api_type: apiType as any,
      api_key: apiKey,
      api_url: apiUrl || undefined,
      model_name: apiModelName,
    }

    try {
      setStatus({ message: '🔍 Тестирование подключения...', type: 'success' })
      await apiModelsApi.test(config)
      
      setStatus({ message: '💾 Сохранение конфигурации...', type: 'success' })
      await apiModelsApi.configure(config)
      
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setStatus({ message: '✓ API модель успешно подключена!', type: 'success' })
      
      // Clear form
      setApiType('')
      setApiKey('')
      setApiUrl('')
      setApiModelName('')
    } catch (error: any) {
      setStatus({ message: `✗ ${error.message}`, type: 'error' })
    }
  }

  const handleDisableAPI = async () => {
    if (!confirm('Отключить API модель и вернуться к Ollama?')) return

    try {
      await apiModelsApi.disable()
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setStatus({ message: '✓ API модель отключена', type: 'success' })
    } catch (error: any) {
      setStatus({ message: `✗ ${error.message}`, type: 'error' })
    }
  }

  const useAPI = settings?.use_api_model
  const apiConfig = settings?.api_model_config

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold">{t.systemSettingsTitle}</h2>

      {/* Ollama Models */}
      <div className="p-5 bg-gray-50 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t.systemSettingsOllama}</h3>
        
        {useAPI && apiConfig && (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span className="font-medium">
                Подключено: {apiConfig.api_type} ({apiConfig.model_name})
              </span>
            </div>
            <button
              onClick={handleDisableAPI}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Отключить API
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">{t.systemSettingsActiveModel}</label>
          <select
            value={localSettings.model || ''}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>{model.name}</option>
            ))}
          </select>
          
          {/* Информация о модели */}
          {localSettings.model && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900">{currentModelConfig.displayName}</div>
                  <div className="text-blue-700 mt-1">{getCategoryDescription(currentModelConfig.category)}</div>
                  <div className="text-blue-600 mt-1">{currentModelConfig.description}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModelsListExpanded(!isModelsListExpanded)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={isModelsListExpanded ? "Свернуть список" : "Развернуть список"}
              >
                {isModelsListExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <label className="text-sm font-medium cursor-pointer" onClick={() => setIsModelsListExpanded(!isModelsListExpanded)}>
                {t.systemSettingsInstalledModels} ({models.length + downloadingModels.size})
              </label>
            </div>
            <button
              onClick={() => setIsModelsModalOpen(true)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Library className="w-4 h-4" />
              Доступные модели
            </button>
          </div>
          
          {isModelsListExpanded && (
            <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
              {/* Загружаемые модели */}
              {Array.from(downloadingModels.entries()).map(([modelName, progress]) => (
                <ModelDownloadItem
                  key={`downloading-${modelName}`}
                  modelName={modelName}
                  isDownloading={true}
                  downloadProgress={progress}
                  onDelete={() => {}}
                />
              ))}
              
              {/* Установленные модели */}
              {models.length === 0 && downloadingModels.size === 0 ? (
                <p className="text-center text-gray-500 py-4">{t.msgNoModels}</p>
              ) : (
                models.map((model) => (
                  <ModelDownloadItem
                    key={model.name}
                    modelName={model.name}
                    size={model.size}
                    isDownloading={false}
                    onDelete={(name) => {
                      if (confirm(`Удалить модель ${name}?`)) {
                        deleteMutation.mutate(name)
                      }
                    }}
                  />
                ))
              )}
            </div>
          )}
          
          {!isModelsListExpanded && (models.length > 0 || downloadingModels.size > 0) && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                Нажмите для просмотра {models.length + downloadingModels.size} {models.length + downloadingModels.size === 1 ? 'модели' : 'моделей'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="p-5 bg-gray-50 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t.systemSettingsAPI}</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">Тип API:</label>
          <select
            value={apiType}
            onChange={(e) => setApiType(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          >
            <option value="">Не использовать (Ollama)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google Gemini</option>
            <option value="custom">Custom API</option>
          </select>
        </div>

        {apiType && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Название модели:</label>
              <input
                type="text"
                value={apiModelName}
                onChange={(e) => setApiModelName(e.target.value)}
                placeholder={
                  apiType === 'gemini' ? 'gemini-2.5-flash' :
                  apiType === 'openai' ? 'gpt-4' :
                  apiType === 'anthropic' ? 'claude-3-opus-20240229' :
                  'model-name'
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {apiType === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2">API URL:</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleConfigureAPI}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Link className="w-5 h-5" />
              Подключить API
            </button>

            {/* API Profile Manager */}
            <div className="pt-4 border-t border-gray-300">
              <APIProfileManager
                currentConfig={{
                  api_type: apiType,
                  api_key: apiKey,
                  api_url: apiUrl,
                  api_model_name: apiModelName,
                }}
                onLoadProfile={(config) => {
                  setApiType(config.api_type)
                  setApiKey(config.api_key)
                  setApiUrl(config.api_url || '')
                  setApiModelName(config.model_name)
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Generation Parameters */}
      <div className="p-5 bg-gray-50 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-primary">
          {t.systemSettingsParameters}
          <span className="text-sm font-normal text-gray-600 ml-2">{t.systemSettingsParametersOllamaOnly}</span>
        </h3>

        {useAPI && (
          <div className="p-3 bg-blue-50 border-l-4 border-primary rounded text-sm">
            ℹ️ {t.systemSettingsParametersNote}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Temperature: <span className="text-primary">{localSettings.temperature?.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({currentModelConfig.temperature.min} - {currentModelConfig.temperature.max})
            </span>
          </label>
          <input
            type="range"
            min={currentModelConfig.temperature.min}
            max={currentModelConfig.temperature.max}
            step={currentModelConfig.temperature.step}
            value={localSettings.temperature || currentModelConfig.temperature.default}
            onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
          <small className="text-gray-600">Креативность ответов (рекомендуется: {currentModelConfig.temperature.default})</small>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Максимум токенов: <span className="text-primary">{localSettings.num_predict}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({currentModelConfig.maxTokens.min} - {currentModelConfig.maxTokens.max})
            </span>
          </label>
          <input
            type="range"
            min={currentModelConfig.maxTokens.min}
            max={currentModelConfig.maxTokens.max}
            step={currentModelConfig.maxTokens.step}
            value={localSettings.num_predict || currentModelConfig.maxTokens.default}
            onChange={(e) => setLocalSettings({ ...localSettings, num_predict: parseInt(e.target.value) })}
            className="w-full"
          />
          <small className="text-gray-600">Длина ответа (рекомендуется: {currentModelConfig.maxTokens.default})</small>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Размер контекста: <span className="text-primary">{localSettings.num_ctx}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({currentModelConfig.contextSize.min} - {currentModelConfig.contextSize.max})
            </span>
          </label>
          <input
            type="range"
            min={currentModelConfig.contextSize.min}
            max={currentModelConfig.contextSize.max}
            step={currentModelConfig.contextSize.step}
            value={localSettings.num_ctx || currentModelConfig.contextSize.default}
            onChange={(e) => setLocalSettings({ ...localSettings, num_ctx: parseInt(e.target.value) })}
            className="w-full"
          />
          <small className="text-gray-600">Память модели (рекомендуется: {currentModelConfig.contextSize.default})</small>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Длина контекста документа: <span className="text-primary">{localSettings.context_length}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({currentModelConfig.contextLength.min} - {currentModelConfig.contextLength.max})
            </span>
          </label>
          <input
            type="range"
            min={currentModelConfig.contextLength.min}
            max={currentModelConfig.contextLength.max}
            step={currentModelConfig.contextLength.step}
            value={localSettings.context_length || currentModelConfig.contextLength.default}
            onChange={(e) => setLocalSettings({ ...localSettings, context_length: parseInt(e.target.value) })}
            className="w-full"
          />
          <small className="text-gray-600">Применяется ко всем моделям (рекомендуется: {currentModelConfig.contextLength.default})</small>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 transition-colors flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {t.systemSettingsSave}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {t.systemSettingsReset}
        </button>
      </div>

      {status && (
        <div className={`
          p-4 rounded-lg text-sm
          ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
          ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
        `}>
          {status.message}
        </div>
      )}

      {/* Ollama Models Modal */}
      <OllamaModelsModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  )
}
