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
from src.settings_manager import SettingsManager
from src.cache_manager import CacheManager
from src.file_utils import generate_safe_filename, save_file
from src.xwiki_connector import XWikiConnector

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
settings_manager = SettingsManager()
cache_manager = CacheManager(ttl=config.CACHE_TTL)
parser = DocumentParser()
embedding_gen = EmbeddingGenerator()
vector_store = VectorStore()
rag_engine = RAGEngine(settings_manager=settings_manager)


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


# Константы
ALLOWED_FILE_EXTENSIONS = ('.pdf', '.docx', '.xlsx', '.xls')

def validate_file(filename: str, content: bytes) -> None:
    """Validate uploaded file"""
    if not filename.endswith(ALLOWED_FILE_EXTENSIONS):
        raise HTTPException(400, f"Only {', '.join(ALLOWED_FILE_EXTENSIONS)} files supported")
    
    if len(content) > config.MAX_UPLOAD_SIZE:
        max_size_mb = config.MAX_UPLOAD_SIZE / 1024 / 1024
        raise HTTPException(413, f"File too large. Max size: {max_size_mb}MB")


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document"""
    try:
        # Чтение и валидация файла
        file_content = await file.read()
        validate_file(file.filename, file_content)
        
        # Генерация безопасного имени файла и сохранение
        safe_filename, file_hash = generate_safe_filename(file.filename, file_content)
        file_path = config.DOCUMENTS_DIR / safe_filename
        save_file(file_path, file_content)
        
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
        metadatas = [{"source": file.filename, "chunk": i, "file_hash": file_hash, "text_length": len(text)} 
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
            cached_result = cache_manager.get_by_text(request.question)
            if cached_result:
                logger.info("Returning cached result")
                return cached_result
        
        result = rag_engine.query(request.question)
        
        # Сохранение в кэш
        if config.ENABLE_CACHE:
            cache_manager.set_by_text(request.question, result)
        
        logger.info(f"Query processed successfully, found {result['sources_count']} sources")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(500, f"Error processing query: {str(e)}")

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
            "cache_size": cache_manager.size() if config.ENABLE_CACHE else 0
        }
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(500, f"Error getting stats: {str(e)}")


@app.delete("/clear")
async def clear_database():
    """Clear vector database"""
    try:
        vector_store.clear_collection()
        cache_manager.clear()
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


@app.get("/settings")
async def get_settings():
    """Get current settings"""
    try:
        settings = settings_manager.settings.copy()
        settings['ollama_url'] = config.OLLAMA_BASE_URL
        # Используем модель из settings_manager, а не из config
        if 'model' not in settings:
            settings['model'] = config.OLLAMA_MODEL
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {str(e)}")
        raise HTTPException(500, f"Error getting settings: {str(e)}")


class SettingsUpdate(BaseModel):
    model: str = None
    temperature: float = None
    num_predict: int = None
    num_ctx: int = None
    context_length: int = None


class XWikiConfig(BaseModel):
    base_url: str
    username: str = None
    password: str = None
    wiki: str = "xwiki"
    space: str = None


class XWikiImportRequest(BaseModel):
    base_url: str
    username: str = None
    password: str = None
    wiki: str = "xwiki"
    space: str = None


@app.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update settings"""
    try:
        updated = {}
        
        # Обновляем настройки
        if settings.model is not None:
            settings_manager.set('model', settings.model)
            config.OLLAMA_MODEL = settings.model
            updated['model'] = settings.model
        
        if settings.temperature is not None:
            settings_manager.set('temperature', settings.temperature)
            updated['temperature'] = settings.temperature
        
        if settings.num_predict is not None:
            settings_manager.set('num_predict', settings.num_predict)
            updated['num_predict'] = settings.num_predict
        
        if settings.num_ctx is not None:
            settings_manager.set('num_ctx', settings.num_ctx)
            updated['num_ctx'] = settings.num_ctx
        
        if settings.context_length is not None:
            settings_manager.set('context_length', settings.context_length)
            updated['context_length'] = settings.context_length
        
        logger.info(f"Settings updated: {updated}")
        return {"status": "success", "message": "Настройки сохранены", "updated": updated}
    
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(500, f"Error updating settings: {str(e)}")


@app.get("/documents")
async def get_documents():
    """Get list of uploaded documents"""
    try:
        # Получаем все документы из коллекции
        collection_data = vector_store.collection.get()
        
        if not collection_data or not collection_data.get('metadatas'):
            return {"documents": []}
        
        # Группируем по файлам
        files_dict = {}
        for metadata in collection_data['metadatas']:
            if metadata and 'source' in metadata:
                source = metadata['source']
                file_hash = metadata.get('file_hash', 'unknown')
                text_length = metadata.get('text_length', 0)
                
                if source not in files_dict:
                    files_dict[source] = {
                        'filename': source,
                        'file_hash': file_hash,
                        'chunks_count': 0,
                        'text_length': text_length
                    }
                files_dict[source]['chunks_count'] += 1
        
        documents = list(files_dict.values())
        return {"documents": documents}
    
    except Exception as e:
        logger.error(f"Error getting documents: {str(e)}")
        return {"documents": []}


@app.post("/xwiki/test")
async def test_xwiki_connection(config: XWikiConfig):
    """Test XWiki connection"""
    try:
        connector = XWikiConnector(
            base_url=config.base_url,
            username=config.username,
            password=config.password
        )
        
        is_connected = connector.test_connection()
        
        if is_connected:
            spaces = connector.get_spaces(config.wiki)
            return {
                "status": "success",
                "message": "Подключение успешно",
                "spaces": spaces
            }
        else:
            return {
                "status": "error",
                "message": "Не удалось подключиться к XWiki"
            }
    
    except Exception as e:
        logger.error(f"Error testing XWiki connection: {str(e)}")
        raise HTTPException(500, f"Error testing connection: {str(e)}")


@app.post("/xwiki/import")
async def import_from_xwiki(request: XWikiImportRequest):
    """Import pages from XWiki"""
    try:
        connector = XWikiConnector(
            base_url=request.base_url,
            username=request.username,
            password=request.password
        )
        
        # Проверяем подключение
        if not connector.test_connection():
            raise HTTPException(400, "Cannot connect to XWiki")
        
        # Получаем страницы
        logger.info(f"Fetching pages from XWiki: wiki={request.wiki}, space={request.space}")
        pages = connector.fetch_all_pages_content(request.wiki, request.space)
        
        if not pages:
            return {
                "status": "warning",
                "message": "Страницы не найдены",
                "imported_count": 0
            }
        
        # Обрабатываем каждую страницу
        imported_count = 0
        for page in pages:
            try:
                content = page['content']
                if not content.strip():
                    continue
                
                # Создаем чанки
                chunks = parser.chunk_text(content, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
                
                # Генерируем эмбеддинги
                embeddings = embedding_gen.generate_embeddings(chunks)
                
                # Сохраняем в векторную БД
                page_id = f"{page['space']}.{page['name']}"
                metadatas = [
                    {
                        "source": f"XWiki: {page['title']}",
                        "chunk": i,
                        "file_hash": page_id,
                        "text_length": len(content),
                        "xwiki_space": page['space'],
                        "xwiki_page": page['name'],
                        "xwiki_url": page.get('url', '')
                    }
                    for i in range(len(chunks))
                ]
                
                vector_store.add_documents(chunks, embeddings, metadatas)
                imported_count += 1
                
                logger.info(f"Imported page: {page['title']} ({len(chunks)} chunks)")
            
            except Exception as e:
                logger.error(f"Error importing page {page.get('title')}: {str(e)}")
                continue
        
        return {
            "status": "success",
            "message": f"Импортировано страниц: {imported_count}",
            "imported_count": imported_count,
            "total_pages": len(pages)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing from XWiki: {str(e)}")
        raise HTTPException(500, f"Error importing from XWiki: {str(e)}")
