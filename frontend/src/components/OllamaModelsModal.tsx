import { useState, useEffect } from 'react'
import { X, Download, Search } from 'lucide-react'

interface OllamaModel {
  name: string
  description: string
  tags: string[]
  size: string
  pulls?: number
}

interface OllamaModelsModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (modelName: string) => void
}

// Популярные модели Ollama
const OLLAMA_MODELS: OllamaModel[] = [
  {
    name: 'llama3.2:1b',
    description: 'Самая быстрая модель Llama 3.2 для базовых задач',
    tags: ['fast', 'lightweight'],
    size: '1.3 GB',
    pulls: 1000000
  },
  {
    name: 'llama3.2:3b',
    description: 'Сбалансированная модель для большинства задач',
    tags: ['balanced', 'recommended'],
    size: '2.0 GB',
    pulls: 800000
  },
  {
    name: 'llama3.1:8b',
    description: 'Мощная модель для сложных задач',
    tags: ['powerful', 'accurate'],
    size: '4.7 GB',
    pulls: 500000
  },
  {
    name: 'phi3:mini',
    description: 'Компактная модель от Microsoft',
    tags: ['fast', 'efficient'],
    size: '2.3 GB',
    pulls: 300000
  },
  {
    name: 'phi3:medium',
    description: 'Средняя модель Phi-3 с хорошим балансом',
    tags: ['balanced'],
    size: '7.9 GB',
    pulls: 200000
  },
  {
    name: 'gemma2:2b',
    description: 'Легкая модель от Google',
    tags: ['fast', 'google'],
    size: '1.6 GB',
    pulls: 250000
  },
  {
    name: 'gemma2:9b',
    description: 'Продвинутая модель Gemma 2',
    tags: ['powerful', 'google'],
    size: '5.5 GB',
    pulls: 150000
  },
  {
    name: 'mistral:7b',
    description: 'Популярная модель Mistral AI',
    tags: ['powerful', 'popular'],
    size: '4.1 GB',
    pulls: 600000
  },
  {
    name: 'qwen2.5:7b',
    description: 'Модель Qwen 2.5 от Alibaba',
    tags: ['multilingual', 'powerful'],
    size: '4.7 GB',
    pulls: 100000
  },
  {
    name: 'codellama:7b',
    description: 'Специализированная модель для программирования',
    tags: ['code', 'programming'],
    size: '3.8 GB',
    pulls: 400000
  },
  {
    name: 'deepseek-coder:6.7b',
    description: 'Модель для написания кода',
    tags: ['code', 'programming'],
    size: '3.8 GB',
    pulls: 200000
  },
  {
    name: 'llama3.1:70b',
    description: 'Самая мощная модель Llama (требует много ресурсов)',
    tags: ['powerful', 'large'],
    size: '40 GB',
    pulls: 100000
  }
]

export default function OllamaModelsModal({ isOpen, onClose, onDownload }: OllamaModelsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredModels, setFilteredModels] = useState(OLLAMA_MODELS)

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredModels(
        OLLAMA_MODELS.filter(
          model =>
            model.name.toLowerCase().includes(query) ||
            model.description.toLowerCase().includes(query) ||
            model.tags.some(tag => tag.toLowerCase().includes(query))
        )
      )
    } else {
      setFilteredModels(OLLAMA_MODELS)
    }
  }, [searchQuery])

  if (!isOpen) return null

  const handleDownload = (modelName: string) => {
    onDownload(modelName)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Доступные модели Ollama</h2>
            <p className="text-sm text-gray-600 mt-1">Выберите модель для загрузки</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, описанию или тегам..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredModels.map((model) => (
              <div
                key={model.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {model.size}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {model.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {model.pulls && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {(model.pulls / 1000).toFixed(0)}K загрузок
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(model.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Модели не найдены</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600 text-center">
            💡 Рекомендуем начать с <strong>llama3.2:3b</strong> для оптимального баланса скорости и качества
          </p>
        </div>
      </div>
    </div>
  )
}
