"""RAG engine for question answering"""
import requests
from typing import List, Dict
import config
from src.embeddings import EmbeddingGenerator
from src.vector_store import VectorStore


class RAGEngine:
    """Retrieval-Augmented Generation engine"""
    
    def __init__(self):
        """Initialize RAG components"""
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = VectorStore()
    
    def query(self, question: str) -> Dict:
        """Process question and generate answer"""
        # Generate embedding for question
        question_embedding = self.embedding_generator.generate_embedding(question)
        
        # Search for relevant documents
        search_results = self.vector_store.search(question_embedding)
        
        # Extract context from search results
        context_docs = search_results.get('documents', [[]])[0]
        context = "\n\n".join(context_docs)
        
        # Generate answer using Ollama
        answer = self._generate_answer(question, context)
        
        return {
            "question": question,
            "answer": answer,
            "context": context_docs,
            "sources_count": len(context_docs)
        }
    
    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using Ollama"""
        prompt = f"""На основе следующего контекста ответь на вопрос. Если в контексте нет информации для ответа, так и скажи.

Контекст:
{context}

Вопрос: {question}

Ответ:"""
        
        try:
            response = requests.post(
                f"{config.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": config.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 512
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
