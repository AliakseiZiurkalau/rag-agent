"""RAG engine for question answering"""
import requests
from typing import List, Dict
import config
from src.embeddings import EmbeddingGenerator
from src.vector_store import VectorStore


class RAGEngine:
    """Retrieval-Augmented Generation engine"""
    
    def __init__(self, settings_manager=None):
        """Initialize RAG components"""
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = VectorStore()
        self.settings_manager = settings_manager
    
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
            
            # Extract unique sources
            sources = self._extract_sources(metadatas)
            
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
    
    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using Ollama"""
        # Получаем настройки
        if self.settings_manager:
            context_length = self.settings_manager.get('context_length', 300)
            temperature = self.settings_manager.get('temperature', 0.1)
            num_predict = self.settings_manager.get('num_predict', 80)
            num_ctx = self.settings_manager.get('num_ctx', 512)
            top_k = self.settings_manager.get('top_k', 10)
            top_p = self.settings_manager.get('top_p', 0.5)
            repeat_penalty = self.settings_manager.get('repeat_penalty', 1.1)
            model = self.settings_manager.get('model', config.OLLAMA_MODEL)
        else:
            context_length = 300
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
