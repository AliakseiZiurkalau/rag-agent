export interface Document {
  filename: string
  file_hash: string
  chunks_count: number
  text_length: number
  uploaded_at?: string
}

export interface Source {
  filename: string
  file_hash: string
  chunks: Array<{
    chunk_id: number
    content: string
  }>
}

export interface QueryResponse {
  question: string
  answer: string
  context: string[]
  sources: Source[]
  sources_count: number
}

export interface Stats {
  documents_count: number
  websites_count: number
  chunks_count: number
  model: string
  embedding_model: string
  chunk_size: number
  top_k_results: number
  cache_enabled: boolean
  cache_size: number
}

export interface HealthStatus {
  status: string
  ollama: string
  vector_store: string
  documents_count: number
}

export interface Settings {
  model: string
  temperature: number
  num_predict: number
  num_ctx: number
  context_length: number
  use_api_model?: boolean
  api_model_config?: APIModelConfig
  ollama_url?: string
}

export interface APIModelConfig {
  api_type: 'openai' | 'anthropic' | 'gemini' | 'custom'
  api_key: string
  api_url?: string
  model_name: string
}

export interface SavedAPIProfile {
  id: string
  name: string
  api_type: 'openai' | 'anthropic' | 'gemini' | 'custom'
  api_key: string
  api_url?: string
  model_name: string
  created_at: string
  last_used?: string
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
  details?: Record<string, any>
}

export interface XWikiConfig {
  base_url: string
  username?: string
  password?: string
  wiki: string
  space?: string
}

export interface XWikiTestResponse {
  status: 'success' | 'error'
  message: string
  spaces?: string[]
}

export interface XWikiImportResponse {
  status: 'success' | 'warning' | 'error'
  message: string
  imported_count: number
  total_pages?: number
}

export interface UploadResponse {
  filename: string
  file_hash: string
  chunks_created: number
  text_length: number
  status: string
}

export type TabType = 'xwiki' | 'documents' | 'chat' | 'settings'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
}
