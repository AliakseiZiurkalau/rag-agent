"""RAG engine for question answering"""
import requests
import logging
from typing import List, Dict
import config
from src.embeddings import EmbeddingGenerator
from src.vector_store import VectorStore
from src.api_model_connector import APIModelConnector

logger = logging.getLogger(__name__)


class RAGEngine:
    """Retrieval-Augmented Generation engine"""
    
    def __init__(self, settings_manager=None):
        """Initialize RAG components"""
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = VectorStore()
        self.settings_manager = settings_manager
        self.api_connector = None
    
    def query(self, question: str) -> Dict:
        """Process question and generate answer"""
        try:
            # Generate embedding for question
            question_embedding = self.embedding_generator.generate_embedding(question)
            
            # Search for relevant documents
            search_results = self.vector_store.search(question_embedding)
            
            # Extract context from search results
            context_docs = search_results.get('documents', [[]])[0]
            metadatas = search_results.get('metadatas', [[]])[0]
            
            if not context_docs:
                return {
                    "question": question,
                    "answer": "Не найдено релевантных документов для ответа на вопрос.",
                    "context": [],
                    "sources": [],
                    "sources_count": 0
                }
            
            context = "\n\n".join(context_docs)
            
            # Extract unique sources with full context
            sources = self._extract_sources_with_context(metadatas, context_docs)
            
            # Generate answer using Ollama
            answer = self._generate_answer(question, context)
            
            return {
                "question": question,
                "answer": answer,
                "context": context_docs,
                "sources": sources,
                "sources_count": len(sources)
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Ошибка обработки запроса: {str(e)}",
                "context": [],
                "sources": [],
                "sources_count": 0
            }
    
    def _extract_sources(self, metadatas: List[Dict]) -> List[Dict]:
        """Extract unique sources from metadata"""
        sources = []
        seen_sources = set()
        
        for metadata in metadatas:
            if metadata and 'source' in metadata:
                source_name = metadata['source']
                if source_name not in seen_sources:
                    sources.append({
                        'filename': source_name,
                        'file_hash': metadata.get('file_hash', ''),
                        'chunk': metadata.get('chunk', 0)
                    })
                    seen_sources.add(source_name)
        
        return sources
    
    def _extract_sources_with_context(self, metadatas: List[Dict], context_docs: List[str]) -> List[Dict]:
        """Extract sources with full context chunks"""
        sources_dict = {}
        
        for i, (metadata, context) in enumerate(zip(metadatas, context_docs)):
            if metadata and 'source' in metadata:
                source_name = metadata['source']
                
                if source_name not in sources_dict:
                    sources_dict[source_name] = {
                        'filename': source_name,
                        'file_hash': metadata.get('file_hash', ''),
                        'chunks': []
                    }
                
                sources_dict[source_name]['chunks'].append({
                    'chunk_id': metadata.get('chunk', i),
                    'content': context
                })
        
        # Сортируем чанки по ID
        for source in sources_dict.values():
            source['chunks'] = sorted(source['chunks'], key=lambda x: x['chunk_id'])
        
        return list(sources_dict.values())
    
    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using Ollama or external API"""
        # Получаем настройки
        if self.settings_manager:
            # Общие настройки
            context_length = self.settings_manager.get('context_length', 300)
            
            # Проверяем, используется ли API модель
            use_api = self.settings_manager.get('use_api_model', False)
            api_config = self.settings_manager.get('api_model_config', {})
            
            # Параметры для Ollama (применяются только к локальным моделям)
            if not use_api:
                temperature = self.settings_manager.get('temperature', 0.1)
                num_predict = self.settings_manager.get('num_predict', 80)
                num_ctx = self.settings_manager.get('num_ctx', 512)
                top_k = self.settings_manager.get('top_k', 10)
                top_p = self.settings_manager.get('top_p', 0.5)
                repeat_penalty = self.settings_manager.get('repeat_penalty', 1.1)
                model = self.settings_manager.get('model', config.OLLAMA_MODEL)
        else:
            context_length = 300
            use_api = False
            api_config = {}
            # Параметры по умолчанию для Ollama
            temperature = 0.1
            num_predict = 80
            num_ctx = 512
            top_k = 10
            top_p = 0.5
            repeat_penalty = 1.1
            model = config.OLLAMA_MODEL
        
        # Сокращаем контекст
        short_context = context[:context_length] if len(context) > context_length else context
        
        # Упрощенный промпт для быстрой генерации
        prompt = f"""Контекст: {short_context}

Вопрос: {question}
Краткий ответ:"""
        
        # Используем API модель, если настроена
        if use_api and api_config:
            try:
                if not self.api_connector:
                    self.api_connector = APIModelConnector(
                        api_type=api_config.get('api_type'),
                        api_key=api_config.get('api_key'),
                        api_url=api_config.get('api_url'),
                        model_name=api_config.get('model_name')
                    )
                
                logger.info(f"Using API model: {api_config.get('api_type')} - {api_config.get('model_name')}")
                logger.debug(f"Prompt length: {len(prompt)}, Context length: {len(short_context)}, Question: {question[:100]}")
                
                # Оптимальные параметры для API моделей (не ограничиваем пользовательскими настройками)
                api_temperature = 0.7  # Оптимально для большинства API
                api_max_tokens = 2000  # Достаточно для полного ответа
                
                # Специфичные настройки для разных API
                api_type = api_config.get('api_type', '').lower()
                if api_type == 'gemini':
                    # Gemini 2.5 нужно больше токенов из-за thinking
                    api_max_tokens = 2000
                elif api_type == 'openai':
                    # OpenAI хорошо работает с меньшими значениями
                    api_max_tokens = 1000
                elif api_type == 'anthropic':
                    # Claude хорошо работает с умеренными значениями
                    api_max_tokens = 1500
                
                result = self.api_connector.generate(prompt, api_temperature, api_max_tokens)
                
                if not result or result.strip() == "":
                    logger.warning("API returned empty result")
                    return "Не удалось получить ответ от модели. Попробуйте переформулировать вопрос."
                
                return result
            except Exception as e:
                logger.error(f"API error: {str(e)}")
                return f"Ошибка при обращении к API: {str(e)}"
        
        # Используем Ollama
        try:
            response = requests.post(
                f"{config.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": num_predict,
                        "num_ctx": num_ctx,
                        "num_thread": 4,
                        "top_k": top_k,
                        "top_p": top_p,
                        "repeat_penalty": repeat_penalty
                    }
                },
                timeout=config.OLLAMA_TIMEOUT
            )
            response.raise_for_status()
            return response.json().get("response", "Ошибка генерации ответа")
        except requests.exceptions.Timeout:
            return "Превышено время ожидания ответа от модели"
        except requests.exceptions.ConnectionError:
            return "Ошибка подключения к Ollama. Убедитесь, что сервис запущен"
        except Exception as e:
            return f"Ошибка при обращении к Ollama: {str(e)}"
