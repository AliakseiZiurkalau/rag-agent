import axios from 'axios'
import type {
  Document,
  QueryResponse,
  Stats,
  HealthStatus,
  Settings,
  OllamaModel,
  XWikiConfig,
  XWikiTestResponse,
  XWikiImportResponse,
  UploadResponse,
  APIModelConfig
} from '../types'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 600000, // 10 minutes for long operations
})

export const healthApi = {
  check: () => api.get<HealthStatus>('/health').then(res => res.data),
}

export const statsApi = {
  get: () => api.get<Stats>('/stats').then(res => res.data),
}

export interface Website {
  site_name: string
  file_hash: string
  pages_count: number
  chunks_count: number
  uploaded_at?: string
}

export const documentsApi = {
  list: () => api.get<{ documents: Document[]; websites: Website[] }>('/documents').then(res => res.data),
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  },
  clear: () => api.delete('/clear').then(res => res.data),
  delete: (fileHash: string) => api.delete(`/documents/${encodeURIComponent(fileHash)}`).then(res => res.data),
}

export const queryApi = {
  ask: (question: string) => 
    api.post<QueryResponse>('/query', { question }).then(res => res.data),
}

export const settingsApi = {
  get: () => api.get<Settings>('/settings').then(res => res.data),
  update: (settings: Partial<Settings>) => 
    api.post('/settings', settings).then(res => res.data),
}

export const modelsApi = {
  list: () => api.get<{ models: OllamaModel[] }>('/models/list').then(res => res.data.models),
  download: (modelName: string) => {
    return api.post('/models/download', { model_name: modelName }, {
      responseType: 'text',
      onDownloadProgress: () => {} // Will be handled by EventSource
    })
  },
  delete: (modelName: string) => 
    api.delete(`/models/${encodeURIComponent(modelName)}`).then(res => res.data),
}

export const apiModelsApi = {
  test: (config: APIModelConfig) => 
    api.post('/models/api/test', config).then(res => res.data),
  configure: (config: APIModelConfig) => 
    api.post('/models/api/configure', config).then(res => res.data),
  disable: () => 
    api.delete('/models/api/configure').then(res => res.data),
}

export const xwikiApi = {
  test: (config: XWikiConfig) => 
    api.post<XWikiTestResponse>('/xwiki/test', config).then(res => res.data),
  import: (config: XWikiConfig) => 
    api.post<XWikiImportResponse>('/xwiki/import', config).then(res => res.data),
}

export interface WebImportConfig {
  url: string
  max_pages: number
  site_name?: string
}

export interface WebTestResponse {
  status: string
  message: string
  title: string
  content_length: number
}

export interface WebImportResponse {
  status: string
  message: string
  imported_count: number
  total_pages: number
}

export const webApi = {
  test: (config: WebImportConfig) => 
    api.post<WebTestResponse>('/web/test', config).then(res => res.data),
  import: (config: WebImportConfig) => 
    api.post<WebImportResponse>('/web/import', config).then(res => res.data),
  delete: (siteName: string) => 
    api.delete(`/websites/${encodeURIComponent(siteName)}`).then(res => res.data),
}

export interface TelegramBotConfig {
  bot_token: string
}

export interface TelegramBotStatus {
  is_running: boolean
  token_configured: boolean
  error?: string
}

export const telegramApi = {
  start: (config: TelegramBotConfig) => 
    api.post('/telegram/start', config).then(res => res.data),
  stop: () => 
    api.post('/telegram/stop').then(res => res.data),
  status: () => 
    api.get<TelegramBotStatus>('/telegram/status').then(res => res.data),
}

export default api
