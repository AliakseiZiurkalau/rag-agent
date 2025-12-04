"""Vector store management using ChromaDB"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict
import config


class VectorStore:
    """Manage vector database operations"""
    
    def __init__(self):
        """Initialize ChromaDB client"""
        self.client = chromadb.PersistentClient(
            path=str(config.CHROMA_DB_DIR),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        # Всегда используем одну и ту же коллекцию
        self.collection = self.client.get_or_create_collection(
            name=config.COLLECTION_NAME
        )
    
    def add_documents(self, texts: List[str], embeddings: List[List[float]], 
                     metadatas: List[Dict] = None):
        """Add documents to vector store"""
        import hashlib
        import time
        
        # Убедимся, что коллекция существует
        self._ensure_collection()
        
        # Генерируем уникальные ID на основе хеша контента и timestamp
        ids = []
        for i, text in enumerate(texts):
            content_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            timestamp = int(time.time() * 1000)
            ids.append(f"doc_{content_hash}_{timestamp}_{i}")
        
        self.collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas or [{}] * len(texts),
            ids=ids
        )
        print(f"Added {len(texts)} documents to vector store")
    
    def search(self, query_embedding: List[float], top_k: int = config.TOP_K_RESULTS) -> Dict:
        """Search for similar documents"""
        # Убедимся, что коллекция существует
        self._ensure_collection()
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        return results
    
    def _ensure_collection(self):
        """Ensure collection exists and is accessible"""
        try:
            # Проверяем, что коллекция доступна
            self.collection.count()
        except Exception as e:
            # Если коллекция недоступна, переподключаемся
            print(f"Collection not accessible, reconnecting: {e}")
            self.collection = self.client.get_or_create_collection(
                name=config.COLLECTION_NAME
            )
    
    def get_collection_count(self) -> int:
        """Get number of documents in collection"""
        self._ensure_collection()
        return self.collection.count()
    
    def clear_collection(self):
        """Clear all documents from collection"""
        self.client.delete_collection(config.COLLECTION_NAME)
        self.collection = self.client.get_or_create_collection(
            name=config.COLLECTION_NAME
        )
        print("Collection cleared")
