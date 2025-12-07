// Конфигурация параметров для различных моделей Ollama

export interface ModelConfig {
  name: string
  displayName: string
  // Рекомендуемые параметры
  temperature: {
    min: number
    max: number
    default: number
    step: number
  }
  maxTokens: {
    min: number
    max: number
    default: number
    step: number
  }
  contextSize: {
    min: number
    max: number
    default: number
    step: number
  }
  contextLength: {
    min: number
    max: number
    default: number
    step: number
  }
  // Характеристики модели
  size: string
  category: 'fast' | 'balanced' | 'powerful' | 'code'
  description: string
}

// Конфигурации для популярных моделей
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Быстрые модели (1-2 GB)
  'llama3.2:1b': {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 1B',
    temperature: { min: 0, max: 1, default: 0.3, step: 0.1 },
    maxTokens: { min: 50, max: 300, default: 100, step: 10 },
    contextSize: { min: 512, max: 2048, default: 1024, step: 256 },
    contextLength: { min: 100, max: 500, default: 200, step: 50 },
    size: '1.3 GB',
    category: 'fast',
    description: 'Самая быстрая модель для простых задач'
  },
  
  'gemma2:2b': {
    name: 'gemma2:2b',
    displayName: 'Gemma 2 2B',
    temperature: { min: 0, max: 1, default: 0.3, step: 0.1 },
    maxTokens: { min: 50, max: 400, default: 120, step: 10 },
    contextSize: { min: 512, max: 4096, default: 2048, step: 256 },
    contextLength: { min: 100, max: 600, default: 250, step: 50 },
    size: '1.6 GB',
    category: 'fast',
    description: 'Быстрая модель от Google'
  },

  // Сбалансированные модели (2-5 GB)
  'llama3.2:3b': {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    temperature: { min: 0, max: 1, default: 0.5, step: 0.1 },
    maxTokens: { min: 50, max: 500, default: 150, step: 10 },
    contextSize: { min: 1024, max: 4096, default: 2048, step: 256 },
    contextLength: { min: 150, max: 800, default: 300, step: 50 },
    size: '2.0 GB',
    category: 'balanced',
    description: 'Оптимальный баланс скорости и качества'
  },

  'phi3:mini': {
    name: 'phi3:mini',
    displayName: 'Phi-3 Mini',
    temperature: { min: 0, max: 1, default: 0.4, step: 0.1 },
    maxTokens: { min: 50, max: 500, default: 150, step: 10 },
    contextSize: { min: 1024, max: 4096, default: 2048, step: 256 },
    contextLength: { min: 150, max: 800, default: 300, step: 50 },
    size: '2.3 GB',
    category: 'balanced',
    description: 'Эффективная модель от Microsoft'
  },

  'mistral:7b': {
    name: 'mistral:7b',
    displayName: 'Mistral 7B',
    temperature: { min: 0, max: 1, default: 0.6, step: 0.1 },
    maxTokens: { min: 100, max: 1000, default: 256, step: 20 },
    contextSize: { min: 2048, max: 8192, default: 4096, step: 512 },
    contextLength: { min: 200, max: 1000, default: 400, step: 50 },
    size: '4.1 GB',
    category: 'balanced',
    description: 'Мощная модель для сложных задач'
  },

  // Мощные модели (5-10 GB)
  'llama3.1:8b': {
    name: 'llama3.1:8b',
    displayName: 'Llama 3.1 8B',
    temperature: { min: 0, max: 1, default: 0.7, step: 0.1 },
    maxTokens: { min: 100, max: 2000, default: 512, step: 50 },
    contextSize: { min: 2048, max: 8192, default: 4096, step: 512 },
    contextLength: { min: 300, max: 1500, default: 500, step: 100 },
    size: '4.7 GB',
    category: 'powerful',
    description: 'Высокое качество ответов'
  },

  'gemma2:9b': {
    name: 'gemma2:9b',
    displayName: 'Gemma 2 9B',
    temperature: { min: 0, max: 1, default: 0.7, step: 0.1 },
    maxTokens: { min: 100, max: 2000, default: 512, step: 50 },
    contextSize: { min: 2048, max: 8192, default: 4096, step: 512 },
    contextLength: { min: 300, max: 1500, default: 500, step: 100 },
    size: '5.5 GB',
    category: 'powerful',
    description: 'Продвинутая модель от Google'
  },

  'phi3:medium': {
    name: 'phi3:medium',
    displayName: 'Phi-3 Medium',
    temperature: { min: 0, max: 1, default: 0.6, step: 0.1 },
    maxTokens: { min: 100, max: 1500, default: 400, step: 50 },
    contextSize: { min: 2048, max: 8192, default: 4096, step: 512 },
    contextLength: { min: 250, max: 1200, default: 450, step: 50 },
    size: '7.9 GB',
    category: 'powerful',
    description: 'Средняя модель Phi-3'
  },

  // Модели для кода
  'codellama:7b': {
    name: 'codellama:7b',
    displayName: 'Code Llama 7B',
    temperature: { min: 0, max: 0.8, default: 0.2, step: 0.1 },
    maxTokens: { min: 100, max: 2000, default: 500, step: 50 },
    contextSize: { min: 2048, max: 16384, default: 8192, step: 1024 },
    contextLength: { min: 300, max: 2000, default: 600, step: 100 },
    size: '3.8 GB',
    category: 'code',
    description: 'Специализирована на программировании'
  },

  'deepseek-coder:6.7b': {
    name: 'deepseek-coder:6.7b',
    displayName: 'DeepSeek Coder 6.7B',
    temperature: { min: 0, max: 0.8, default: 0.2, step: 0.1 },
    maxTokens: { min: 100, max: 2000, default: 500, step: 50 },
    contextSize: { min: 2048, max: 16384, default: 8192, step: 1024 },
    contextLength: { min: 300, max: 2000, default: 600, step: 100 },
    size: '3.8 GB',
    category: 'code',
    description: 'Модель для написания кода'
  },

  'qwen2.5:7b': {
    name: 'qwen2.5:7b',
    displayName: 'Qwen 2.5 7B',
    temperature: { min: 0, max: 1, default: 0.6, step: 0.1 },
    maxTokens: { min: 100, max: 1500, default: 400, step: 50 },
    contextSize: { min: 2048, max: 8192, default: 4096, step: 512 },
    contextLength: { min: 250, max: 1200, default: 450, step: 50 },
    size: '4.7 GB',
    category: 'balanced',
    description: 'Мультиязычная модель от Alibaba'
  },

  // Очень большие модели
  'llama3.1:70b': {
    name: 'llama3.1:70b',
    displayName: 'Llama 3.1 70B',
    temperature: { min: 0, max: 1, default: 0.8, step: 0.1 },
    maxTokens: { min: 200, max: 4000, default: 1024, step: 100 },
    contextSize: { min: 4096, max: 32768, default: 8192, step: 2048 },
    contextLength: { min: 500, max: 3000, default: 1000, step: 100 },
    size: '40 GB',
    category: 'powerful',
    description: 'Максимальное качество (требует много ресурсов)'
  }
}

// Конфигурация по умолчанию для неизвестных моделей
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  name: 'default',
  displayName: 'Default',
  temperature: { min: 0, max: 1, default: 0.5, step: 0.1 },
  maxTokens: { min: 50, max: 500, default: 150, step: 10 },
  contextSize: { min: 512, max: 4096, default: 2048, step: 256 },
  contextLength: { min: 100, max: 1000, default: 300, step: 50 },
  size: 'Unknown',
  category: 'balanced',
  description: 'Стандартные параметры'
}

// Функция для получения конфигурации модели
export function getModelConfig(modelName: string): ModelConfig {
  // Точное совпадение
  if (MODEL_CONFIGS[modelName]) {
    return MODEL_CONFIGS[modelName]
  }

  // Поиск по базовому имени (например, "llama3.2:3b-instruct" -> "llama3.2:3b")
  const baseName = modelName.split('-')[0]
  if (MODEL_CONFIGS[baseName]) {
    return MODEL_CONFIGS[baseName]
  }

  // Поиск по префиксу
  for (const key in MODEL_CONFIGS) {
    if (modelName.startsWith(key)) {
      return MODEL_CONFIGS[key]
    }
  }

  return DEFAULT_MODEL_CONFIG
}

// Функция для получения описания категории
export function getCategoryDescription(category: ModelConfig['category']): string {
  const descriptions = {
    fast: '⚡ Быстрая - для простых задач',
    balanced: '⚖️ Сбалансированная - универсальная',
    powerful: '💪 Мощная - для сложных задач',
    code: '💻 Для программирования'
  }
  return descriptions[category]
}
