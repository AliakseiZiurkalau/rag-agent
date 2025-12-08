"""FastAPI server for RAG agent"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import shutil
import logging
import hashlib
from functools import lru_cache
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import config
from src.document_parser import DocumentParser
from src.embeddings import EmbeddingGenerator
from src.vector_store import VectorStore
from src.rag_engine import RAGEngine
from src.settings_manager import SettingsManager
from src.cache_manager import CacheManager
from src.file_utils import generate_safe_filename, save_file
from src.xwiki_connector import XWikiConnector
from src.web_scraper import WebScraper
from urllib.parse import urlparse

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(config.LOG_FILE), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Agent API", version="1.0.0")

# Rate limiting для защиты от злоупотреблений
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware с настройкой из конфига
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression для уменьшения размера ответов
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Статические файлы для веб-интерфейса
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Initialize lightweight components
settings_manager = SettingsManager()
cache_manager = CacheManager(ttl=config.CACHE_TTL)
parser = DocumentParser()

# Lazy initialization for heavy components
_embedding_gen = None
_vector_store = None
_rag_engine = None

def get_embedding_gen():
    """Lazy initialization of embedding generator"""
    global _embedding_gen
    if _embedding_gen is None:
        logger.info("Initializing embedding generator...")
        _embedding_gen = EmbeddingGenerator()
    return _embedding_gen

def get_vector_store():
    """Lazy initialization of vector store"""
    global _vector_store
    if _vector_store is None:
        logger.info("Initializing vector store...")
        _vector_store = VectorStore()
    return _vector_store

def get_rag_engine():
    """Lazy initialization of RAG engine"""
    global _rag_engine
    if _rag_engine is None:
        logger.info("Initializing RAG engine...")
        _rag_engine = RAGEngine(settings_manager=settings_manager)
    return _rag_engine


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
        raise HTTPException(413, f"File too large. Max size: {int(max_size_mb)}MB")


@app.post("/upload")
@limiter.limit("10/minute")
async def upload_document(request: Request, file: UploadFile = File(...)):
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
        try:
            text = parser.parse_document(file_path)
        except ValueError as e:
            logger.error(f"Cannot parse document {safe_filename}: {str(e)}")
            raise HTTPException(400, str(e))
        
        if not text.strip():
            logger.error(f"Document is empty after parsing: {safe_filename}")
            raise HTTPException(400, "Document is empty or could not be parsed")
        
        chunks = parser.chunk_text(text, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
        logger.info(f"Created {len(chunks)} chunks from {safe_filename}")
        
        # Генерация эмбеддингов
        embeddings = get_embedding_gen().generate_embeddings(chunks)
        
        # Сохранение в векторную БД
        from datetime import datetime
        uploaded_at = datetime.now().isoformat()
        metadatas = [{"source": file.filename, "chunk": i, "file_hash": file_hash, "text_length": len(text), "uploaded_at": uploaded_at} 
                     for i in range(len(chunks))]
        get_vector_store().add_documents(chunks, embeddings, metadatas)
        
        logger.info(f"Successfully processed {safe_filename}")
        
        return {
            "filename": file.filename,
            "file_hash": file_hash,
            "chunks_created": len(chunks),
            "text_length": len(text),
            "status": "processed"
        }
    
    except HTTPException as e:
        logger.error(f"HTTP error processing file {file.filename}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Error processing document: {str(e)}")


@app.post("/query")
@limiter.limit("30/minute")
async def query(request: Request, query_request: QueryRequest):
    """Query the RAG system"""
    try:
        if not query_request.question.strip():
            raise HTTPException(400, "Question cannot be empty")
        
        logger.info(f"Processing query: {query_request.question[:100]}...")
        
        # Кэширование запросов
        if config.ENABLE_CACHE:
            cached_result = cache_manager.get_by_text(query_request.question)
            if cached_result:
                logger.info("Returning cached result")
                return cached_result
        
        result = get_rag_engine().query(query_request.question)
        
        # Сохранение в кэш
        if config.ENABLE_CACHE:
            cache_manager.set_by_text(query_request.question, result)
        
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
        # Получаем данные о документах и сайтах
        collection_data = get_vector_store().collection.get()
        
        chunks_count = get_vector_store().get_collection_count()
        documents_count = 0
        websites_count = 0
        
        if collection_data and collection_data.get('metadatas'):
            # Подсчитываем уникальные документы
            unique_files = set()
            unique_sites = set()
            
            for metadata in collection_data['metadatas']:
                if metadata:
                    if metadata.get('web_url'):
                        # Это веб-сайт
                        unique_sites.add(metadata.get('web_site', 'Unknown'))
                    else:
                        # Это документ
                        unique_files.add(metadata.get('source', 'Unknown'))
            
            documents_count = len(unique_files)
            websites_count = len(unique_sites)
        
        # Получаем текущую модель из настроек
        current_model = settings_manager.get('model', config.OLLAMA_MODEL)
        
        # Если используется API модель, показываем её
        if settings_manager.get('use_api_model', False):
            api_config = settings_manager.get('api_model_config')
            if api_config:
                current_model = f"{api_config.get('api_type', 'API')}: {api_config.get('model_name', 'Unknown')}"
        
        return {
            "documents_count": documents_count,
            "websites_count": websites_count,
            "chunks_count": chunks_count,
            "model": current_model,
            "embedding_model": config.EMBEDDING_MODEL,
            "chunk_size": config.CHUNK_SIZE,
            "top_k_results": settings_manager.get('context_length', config.TOP_K_RESULTS),
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
        get_vector_store().clear_collection()
        cache_manager.clear()
        logger.info("Database and cache cleared")
        return {"status": "database and cache cleared"}
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        raise HTTPException(500, f"Error clearing database: {str(e)}")


@app.delete("/documents/{file_hash}")
async def delete_document(file_hash: str):
    """Delete a specific document by file_hash"""
    try:
        deleted_count = get_vector_store().delete_document_by_hash(file_hash)
        
        if deleted_count == 0:
            raise HTTPException(404, f"Document with hash {file_hash} not found")
        
        # Очищаем кэш после удаления документа
        cache_manager.clear()
        
        logger.info(f"Deleted document with hash {file_hash} ({deleted_count} chunks)")
        return {
            "status": "success",
            "message": f"Document deleted ({deleted_count} chunks)",
            "deleted_chunks": deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(500, f"Error deleting document: {str(e)}")

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
        "documents_count": get_vector_store().get_collection_count(),
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


class ModelDownloadRequest(BaseModel):
    model_name: str


class APIModelConfig(BaseModel):
    api_type: str  # "openai", "anthropic", "custom", "gemini"
    api_key: str
    api_url: Optional[str] = None
    model_name: str


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


class WebImportRequest(BaseModel):
    url: str
    max_pages: int = 10
    site_name: str = None


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


@app.get("/models/list")
async def list_models():
    """Get list of available Ollama models"""
    try:
        import requests
        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=10)
        response.raise_for_status()
        
        data = response.json()
        models = []
        
        if 'models' in data:
            for model in data['models']:
                models.append({
                    'name': model.get('name'),
                    'size': model.get('size', 0),
                    'modified_at': model.get('modified_at'),
                    'details': model.get('details', {})
                })
        
        return {"models": models}
    
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(500, f"Error listing models: {str(e)}")


@app.get("/models/download")
async def download_model(model_name: str):
    """Download Ollama model with streaming progress"""
    from fastapi.responses import StreamingResponse
    import json
    
    async def generate_progress():
        import requests
        
        logger.info(f"Starting download of model: {model_name}")
        
        try:
            # Запускаем загрузку модели
            response = requests.post(
                f"{config.OLLAMA_BASE_URL}/api/pull",
                json={"name": model_name},
                stream=True,
                timeout=None
            )
            
            if response.status_code != 200:
                yield f"data: {json.dumps({'status': 'error', 'message': f'Ошибка: {response.text}'})}\n\n"
                return
            
            # Отправляем прогресс
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        # Отправляем данные клиенту
                        yield f"data: {json.dumps(data)}\n\n"
                        
                        # Если загрузка завершена
                        if data.get('status') == 'success':
                            logger.info(f"Model {model_name} downloaded successfully")
                            break
                    except json.JSONDecodeError:
                        continue
            
            # Финальное сообщение
            yield f"data: {json.dumps({'status': 'complete', 'model': model_name})}\n\n"
            
        except Exception as e:
            logger.error(f"Error downloading model: {str(e)}")
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.delete("/models/{model_name}")
async def delete_model(model_name: str):
    """Delete Ollama model"""
    try:
        import requests
        
        logger.info(f"Deleting model: {model_name}")
        
        response = requests.delete(
            f"{config.OLLAMA_BASE_URL}/api/delete",
            json={"name": model_name},
            timeout=30
        )
        
        if response.status_code == 200:
            return {
                "status": "success",
                "message": f"Модель {model_name} удалена"
            }
        elif response.status_code == 404:
            raise HTTPException(404, f"Модель {model_name} не найдена")
        else:
            raise HTTPException(400, f"Ошибка удаления модели: {response.text}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model: {str(e)}")
        raise HTTPException(500, f"Error deleting model: {str(e)}")


@app.post("/models/api/test")
async def test_api_connection(config_data: APIModelConfig):
    """Test API connection before saving configuration"""
    from src.api_model_connector import APIModelConnector
    
    try:
        logger.info(f"Testing API connection: {config_data.api_type} - {config_data.model_name}")
        
        # Создаем временный коннектор для тестирования
        connector = APIModelConnector(
            api_type=config_data.api_type,
            api_key=config_data.api_key,
            api_url=config_data.api_url,
            model_name=config_data.model_name
        )
        
        # Тестируем подключение
        test_result = connector.test_connection()
        
        if test_result:
            return {
                "status": "success",
                "message": f"Подключение к {config_data.api_type} успешно!",
                "api_type": config_data.api_type,
                "model_name": config_data.model_name
            }
        else:
            raise HTTPException(400, "Не удалось подключиться к API. Проверьте ключ и название модели.")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing API connection: {str(e)}")
        raise HTTPException(400, f"Ошибка подключения: {str(e)}")


@app.post("/models/api/configure")
async def configure_api_model(config_data: APIModelConfig):
    """Configure external API model (OpenAI, Anthropic, etc.)"""
    from src.api_model_connector import APIModelConnector
    
    try:
        logger.info(f"Configuring API model: {config_data.api_type} - {config_data.model_name}")
        
        # Тестируем подключение перед сохранением
        connector = APIModelConnector(
            api_type=config_data.api_type,
            api_key=config_data.api_key,
            api_url=config_data.api_url,
            model_name=config_data.model_name
        )
        
        test_result = connector.test_connection()
        
        if not test_result:
            raise HTTPException(400, "Не удалось подключиться к API. Проверьте ключ и название модели.")
        
        # Сохраняем конфигурацию API модели
        api_config = {
            'api_type': config_data.api_type,
            'api_key': config_data.api_key,
            'api_url': config_data.api_url,
            'model_name': config_data.model_name
        }
        
        settings_manager.set('api_model_config', api_config)
        settings_manager.set('use_api_model', True)
        
        # Обновляем RAG engine для использования новой конфигурации
        get_rag_engine().api_connector = None
        
        logger.info(f"Successfully configured API model: {config_data.api_type} - {config_data.model_name}")
        
        return {
            "status": "success",
            "message": f"API модель {config_data.model_name} успешно подключена!",
            "api_type": config_data.api_type
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring API model: {str(e)}")
        raise HTTPException(500, f"Error configuring API model: {str(e)}")


@app.delete("/models/api/configure")
async def disable_api_model():
    """Disable external API model and switch back to Ollama"""
    try:
        settings_manager.set('use_api_model', False)
        get_rag_engine().api_connector = None
        
        logger.info("Disabled API model, switched back to Ollama")
        
        return {
            "status": "success",
            "message": "API модель отключена, используется Ollama"
        }
    
    except Exception as e:
        logger.error(f"Error disabling API model: {str(e)}")
        raise HTTPException(500, f"Error disabling API model: {str(e)}")


@app.get("/documents")
async def get_documents():
    """Get list of uploaded documents"""
    try:
        # Получаем все документы из коллекции
        collection_data = get_vector_store().collection.get()
        
        if not collection_data or not collection_data.get('metadatas'):
            return {"documents": [], "websites": []}
        
        # Группируем по файлам и веб-сайтам
        files_dict = {}
        websites_dict = {}
        
        for metadata in collection_data['metadatas']:
            if metadata and 'source' in metadata:
                source = metadata['source']
                file_hash = metadata.get('file_hash', 'unknown')
                text_length = metadata.get('text_length', 0)
                uploaded_at = metadata.get('uploaded_at', None)
                
                # Проверяем, это веб-сайт или документ
                if metadata.get('web_url'):
                    # Это веб-страница
                    web_site = metadata.get('web_site', 'Unknown Site')
                    
                    if web_site not in websites_dict:
                        websites_dict[web_site] = {
                            'site_name': web_site,
                            'file_hash': file_hash,
                            'pages_count': 0,
                            'chunks_count': 0,
                            'uploaded_at': uploaded_at,
                            '_pages': set()
                        }
                    websites_dict[web_site]['chunks_count'] += 1
                    # Подсчитываем уникальные страницы
                    websites_dict[web_site]['_pages'].add(metadata.get('web_url'))
                else:
                    # Это обычный документ
                    if source not in files_dict:
                        files_dict[source] = {
                            'filename': source,
                            'file_hash': file_hash,
                            'chunks_count': 0,
                            'text_length': text_length,
                            'uploaded_at': uploaded_at
                        }
                    files_dict[source]['chunks_count'] += 1
        
        # Подсчитываем количество страниц для веб-сайтов
        for site_data in websites_dict.values():
            if '_pages' in site_data:
                site_data['pages_count'] = len(site_data['_pages'])
                del site_data['_pages']
        
        documents = list(files_dict.values())
        websites = list(websites_dict.values())
        
        return {"documents": documents, "websites": websites}
    
    except Exception as e:
        logger.error(f"Error getting documents: {str(e)}")
        return {"documents": [], "websites": []}


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
            raise HTTPException(503, "Не удалось подключиться к XWiki")
    
    except HTTPException:
        raise
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
                embeddings = get_embedding_gen().generate_embeddings(chunks)
                
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
                
                get_vector_store().add_documents(chunks, embeddings, metadatas)
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


@app.post("/web/import")
@limiter.limit("5/minute")
async def import_from_web(request: Request, import_request: WebImportRequest):
    """Import pages from website"""
    try:
        scraper = WebScraper()
        
        # Проверяем URL
        if not import_request.url.startswith(('http://', 'https://')):
            raise HTTPException(400, "URL must start with http:// or https://")
        
        logger.info(f"Importing from website: {import_request.url} (max {import_request.max_pages} pages)")
        
        # Скрапим сайт
        pages = scraper.scrape_website(import_request.url, max_pages=import_request.max_pages)
        
        if not pages:
            return {
                "status": "warning",
                "message": "No pages found or could not scrape website",
                "imported_count": 0
            }
        
        # Обрабатываем каждую страницу
        imported_count = 0
        site_name = import_request.site_name or urlparse(import_request.url).netloc
        
        for page in pages:
            try:
                content = page['content']
                if not content.strip():
                    continue
                
                # Создаем чанки
                chunks = parser.chunk_text(content, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
                
                # Генерируем эмбеддинги
                embeddings = get_embedding_gen().generate_embeddings(chunks)
                
                # Сохраняем в векторную БД
                from datetime import datetime
                import hashlib
                
                page_hash = hashlib.md5(page['url'].encode()).hexdigest()[:16]
                uploaded_at = datetime.now().isoformat()
                
                metadatas = [
                    {
                        "source": f"Web: {page['title']}",
                        "chunk": i,
                        "file_hash": page_hash,
                        "text_length": len(content),
                        "uploaded_at": uploaded_at,
                        "web_url": page['url'],
                        "web_site": site_name
                    }
                    for i in range(len(chunks))
                ]
                
                get_vector_store().add_documents(chunks, embeddings, metadatas)
                imported_count += 1
                
                logger.info(f"Imported page: {page['title']} ({len(chunks)} chunks)")
            
            except Exception as e:
                logger.error(f"Error importing page {page.get('url')}: {str(e)}")
                continue
        
        return {
            "status": "success",
            "message": f"Imported {imported_count} pages from {site_name}",
            "imported_count": imported_count,
            "total_pages": len(pages)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing from web: {str(e)}")
        raise HTTPException(500, f"Error importing from web: {str(e)}")


@app.post("/web/test")
async def test_web_url(request: WebImportRequest):
    """Test if URL is accessible"""
    try:
        scraper = WebScraper()
        
        if not request.url.startswith(('http://', 'https://')):
            raise HTTPException(400, "URL must start with http:// or https://")
        
        # Пробуем получить страницу
        page_data = scraper.scrape_single_page(request.url)
        
        return {
            "status": "success",
            "message": "URL is accessible",
            "title": page_data['title'],
            "content_length": len(page_data['content'])
        }
    
    except Exception as e:
        logger.error(f"Error testing web URL: {str(e)}")
        raise HTTPException(400, f"Cannot access URL: {str(e)}")


@app.delete("/websites/{site_name:path}")
async def delete_website(site_name: str):
    """Delete all pages from a website by site name"""
    try:
        # Декодируем URL-encoded имя сайта
        from urllib.parse import unquote
        site_name = unquote(site_name)
        
        logger.info(f"Attempting to delete website: {site_name}")
        
        # Получаем все документы с данным site_name
        vector_store = get_vector_store()
        collection_data = vector_store.collection.get(
            where={"web_site": site_name}
        )
        
        if not collection_data or not collection_data.get('ids'):
            logger.warning(f"Website {site_name} not found in database")
            raise HTTPException(404, f"Website {site_name} not found")
        
        # Удаляем все найденные чанки
        ids_to_delete = collection_data['ids']
        vector_store.collection.delete(ids=ids_to_delete)
        
        # Очищаем кэш
        cache_manager.clear()
        
        deleted_count = len(ids_to_delete)
        logger.info(f"Deleted website {site_name} ({deleted_count} chunks)")
        
        return {
            "status": "success",
            "message": f"Website deleted ({deleted_count} chunks)",
            "deleted_chunks": deleted_count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting website: {str(e)}")
        raise HTTPException(500, f"Error deleting website: {str(e)}")


# ============================================================================
# Telegram Bot Endpoints
# ============================================================================

class TelegramBotConfig(BaseModel):
    bot_token: str


@app.post("/telegram/start")
async def start_telegram_bot_endpoint(config: TelegramBotConfig):
    """Start Telegram bot"""
    try:
        from src.telegram_bot import start_telegram_bot, get_bot_instance
        import asyncio
        
        # Проверяем, не запущен ли уже бот
        existing_bot = get_bot_instance()
        if existing_bot and existing_bot.is_running:
            status = await existing_bot.get_status()
            return {
                "status": "already_running",
                "message": "Telegram бот уже запущен",
                **status
            }
        
        logger.info("Starting Telegram bot...")
        
        # Запускаем бота в фоновом режиме
        bot = await start_telegram_bot(config.bot_token, settings_manager)
        
        # Получаем статус с username
        status = await bot.get_status()
        
        return {
            "status": "success",
            "message": "Telegram бот успешно запущен",
            **status
        }
    
    except Exception as e:
        logger.error(f"Error starting Telegram bot: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Ошибка запуска Telegram бота: {str(e)}")


@app.post("/telegram/stop")
async def stop_telegram_bot_endpoint():
    """Stop Telegram bot"""
    try:
        from src.telegram_bot import stop_telegram_bot, get_bot_instance
        
        bot = get_bot_instance()
        if not bot or not bot.is_running:
            return {
                "status": "not_running",
                "message": "Telegram бот не запущен"
            }
        
        logger.info("Stopping Telegram bot...")
        await stop_telegram_bot()
        
        return {
            "status": "success",
            "message": "Telegram бот остановлен"
        }
    
    except Exception as e:
        logger.error(f"Error stopping Telegram bot: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Ошибка остановки Telegram бота: {str(e)}")


@app.get("/telegram/status")
async def get_telegram_bot_status():
    """Get Telegram bot status"""
    try:
        from src.telegram_bot import get_bot_instance
        
        bot = get_bot_instance()
        if bot:
            return await bot.get_status()
        else:
            return {
                "is_running": False,
                "token_configured": False
            }
    
    except Exception as e:
        logger.error(f"Error getting Telegram bot status: {str(e)}")
        return {
            "is_running": False,
            "token_configured": False,
            "error": str(e)
        }
