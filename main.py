"""Main entry point for RAG agent"""
import uvicorn
import config
import logging

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    logger.info("Starting RAG Agent API...")
    logger.info(f"Ollama URL: {config.OLLAMA_BASE_URL}")
    logger.info(f"Model: {config.OLLAMA_MODEL}")
    logger.info(f"Embedding Model: {config.EMBEDDING_MODEL}")
    logger.info(f"Documents directory: {config.DOCUMENTS_DIR}")
    logger.info(f"Cache enabled: {config.ENABLE_CACHE}")
    
    uvicorn.run(
        "api.server:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=False,
        log_level=config.LOG_LEVEL.lower()
    )
