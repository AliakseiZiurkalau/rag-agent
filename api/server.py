"""FastAPI server for RAG agent"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import shutil
import logging
import hashlib
from functools import lru_cache
import config
from src.document_parser import DocumentParser
from src.embeddings import EmbeddingGenerator
from src.vector_store import VectorStore
from src.rag_engine import RAGEngine

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(config.LOG_FILE), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Agent API", version="1.0.0")

# CORS middleware с настройкой из конфига
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы для веб-интерфейса
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Initialize components
parser = DocumentParser()
embedding_gen = EmbeddingGenerator()
vector_store = VectorStore()
rag_engine = RAGEngine()


class QueryRequest(BaseModel):
    question: str


@app.get("/")
async def root():
    """Serve web interface"""
    index_file = Path(__file__).parent.parent / "static" / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "RAG Agent API", "status": "running"}


@app.get("/api")
async def api_root():
    return {"message": "RAG Agent API", "status": "running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document"""
    try:
        # Валидация типа файла
        if not file.filename.endswith(('.pdf', '.docx')):
            raise HTTPException(400, "Only PDF and DOCX files supported")
        
        # Проверка размера файла
        file_content = await file.read()
        if len(file_content) > config.MAX_UPLOAD_SIZE:
            raise HTTPException(413, f"File too large. Max size: {config.MAX_UPLOAD_SIZE / 1024 / 1024}MB")
        
        # Генерация безопасного имени файла
        file_hash = hashlib.md5(file_content).hexdigest()[:8]
        safe_filename = f"{file_hash}_{file.filename}"
        file_path = config.DOCUMENTS_DIR / safe_filename
        
        # Сохранение файла
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        logger.info(f"Processing file: {safe_filename}")
        
        # Парсинг документа
        text = parser.parse_document(file_path)
        if not text.strip():
            raise HTTPException(400, "Document is empty or could not be parsed")
        
        chunks = parser.chunk_text(text, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
        logger.info(f"Created {len(chunks)} chunks from {safe_filename}")
        
        # Генерация эмбеддингов
        embeddings = embedding_gen.generate_embeddings(chunks)
        
        # Сохранение в векторную БД
        metadatas = [{"source": file.filename, "chunk": i, "file_hash": file_hash} 
                     for i in range(len(chunks))]
        vector_store.add_documents(chunks, embeddings, metadatas)
        
        logger.info(f"Successfully processed {safe_filename}")
        
        return {
            "filename": file.filename,
            "file_hash": file_hash,
            "chunks_created": len(chunks),
            "text_length": len(text),
            "status": "processed"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        raise HTTPException(500, f"Error processing document: {str(e)}")


@app.post("/query")
async def query(request: QueryRequest):
    """Query the RAG system"""
    try:
        if not request.question.strip():
            raise HTTPException(400, "Question cannot be empty")
        
        logger.info(f"Processing query: {request.question[:100]}...")
        
        # Кэширование запросов
        if config.ENABLE_CACHE:
            cache_key = hashlib.md5(request.question.encode()).hexdigest()
            cached_result = query_cache.get(cache_key)
            if cached_result:
                logger.info("Returning cached result")
                return cached_result
        
        result = rag_engine.query(request.question)
        
        # Сохранение в кэш
        if config.ENABLE_CACHE:
            query_cache[cache_key] = result
        
        logger.info(f"Query processed successfully, found {result['sources_count']} sources")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(500, f"Error processing query: {str(e)}")

# Простой кэш для запросов
query_cache = {}


@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    try:
        return {
            "documents_count": vector_store.get_collection_count(),
            "model": config.OLLAMA_MODEL,
            "embedding_model": config.EMBEDDING_MODEL,
            "chunk_size": config.CHUNK_SIZE,
            "top_k_results": config.TOP_K_RESULTS,
            "cache_enabled": config.ENABLE_CACHE,
            "cache_size": len(query_cache) if config.ENABLE_CACHE else 0
        }
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(500, f"Error getting stats: {str(e)}")


@app.delete("/clear")
async def clear_database():
    """Clear vector database"""
    try:
        vector_store.clear_collection()
        query_cache.clear()
        logger.info("Database and cache cleared")
        return {"status": "database and cache cleared"}
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        raise HTTPException(500, f"Error clearing database: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Проверка подключения к Ollama
        import requests

        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=5)
        ollama_status = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        ollama_status = "unreachable"

    return {
        "status": "healthy",
        "ollama": ollama_status,
        "vector_store": "healthy",
        "documents_count": vector_store.get_collection_count(),
    }
