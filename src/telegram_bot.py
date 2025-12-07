"""Telegram Bot для RAG Agent"""
import logging
import asyncio
from typing import Optional
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from src.rag_engine import RAGEngine
from src.settings_manager import SettingsManager

logger = logging.getLogger(__name__)


class TelegramBot:
    """Telegram Bot для взаимодействия с RAG системой"""
    
    def __init__(self, token: str, settings_manager: SettingsManager):
        """
        Инициализация бота
        
        Args:
            token: Telegram Bot Token
            settings_manager: Менеджер настроек
        """
        self.token = token
        self.settings_manager = settings_manager
        self.application: Optional[Application] = None
        self.rag_engine: Optional[RAGEngine] = None
        self.is_running = False
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        welcome_message = (
            "👋 Привет! Я RAG Agent бот.\n\n"
            "Я могу отвечать на вопросы по загруженным документам.\n\n"
            "Просто отправьте мне свой вопрос, и я найду ответ в базе знаний!\n\n"
            "Команды:\n"
            "/start - Показать это сообщение\n"
            "/help - Помощь\n"
            "/stats - Статистика системы"
        )
        await update.message.reply_text(welcome_message)
        logger.info(f"User {update.effective_user.id} started the bot")
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        help_message = (
            "📚 Как использовать бота:\n\n"
            "1. Просто отправьте мне вопрос\n"
            "2. Я найду ответ в загруженных документах\n"
            "3. Получите детальный ответ с источниками\n\n"
            "Примеры вопросов:\n"
            "• Что такое RAG?\n"
            "• Как работает система?\n"
            "• Расскажи о документе X\n\n"
            "Команды:\n"
            "/start - Начать работу\n"
            "/help - Эта справка\n"
            "/stats - Статистика"
        )
        await update.message.reply_text(help_message)
    
    async def stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /stats"""
        try:
            if not self.rag_engine:
                self.rag_engine = RAGEngine(settings_manager=self.settings_manager)
            
            from src.vector_store import VectorStore
            vector_store = VectorStore()
            
            chunks_count = vector_store.get_collection_count()
            
            # Получаем статистику
            collection_data = vector_store.collection.get()
            documents_count = 0
            websites_count = 0
            
            if collection_data and collection_data.get('metadatas'):
                unique_files = set()
                unique_sites = set()
                
                for metadata in collection_data['metadatas']:
                    if metadata:
                        if metadata.get('web_url'):
                            unique_sites.add(metadata.get('web_site', 'Unknown'))
                        else:
                            unique_files.add(metadata.get('source', 'Unknown'))
                
                documents_count = len(unique_files)
                websites_count = len(unique_sites)
            
            stats_message = (
                "📊 Статистика системы:\n\n"
                f"📄 Документов: {documents_count}\n"
                f"🌍 Веб-сайтов: {websites_count}\n"
                f"📦 Чанков: {chunks_count}\n"
                f"🤖 Модель: {self.settings_manager.get('model', 'llama3.2:3b')}\n"
                f"🔍 Top-K: {self.settings_manager.get('context_length', 300)}"
            )
            await update.message.reply_text(stats_message)
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            await update.message.reply_text("❌ Ошибка получения статистики")
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик текстовых сообщений"""
        try:
            user_message = update.message.text
            user_id = update.effective_user.id
            
            logger.info(f"User {user_id} asked: {user_message[:100]}")
            
            # Отправляем индикатор "печатает..."
            await update.message.chat.send_action("typing")
            
            # Инициализируем RAG engine если нужно
            if not self.rag_engine:
                self.rag_engine = RAGEngine(settings_manager=self.settings_manager)
            
            # Получаем ответ от RAG системы
            result = self.rag_engine.query(user_message)
            
            # Формируем ответ
            answer = result.get('answer', 'Не удалось найти ответ')
            sources_count = result.get('sources_count', 0)
            
            response = f"{answer}\n\n"
            
            if sources_count > 0:
                response += f"📚 Источников использовано: {sources_count}"
            else:
                response += "ℹ️ Ответ сгенерирован без использования документов"
            
            # Отправляем ответ
            await update.message.reply_text(response)
            
            logger.info(f"Answered user {user_id} with {sources_count} sources")
            
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
            await update.message.reply_text(
                "❌ Произошла ошибка при обработке вашего вопроса. "
                "Пожалуйста, попробуйте еще раз."
            )
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик ошибок"""
        logger.error(f"Update {update} caused error {context.error}")
    
    async def start(self):
        """Запуск бота"""
        try:
            logger.info("Starting Telegram bot...")
            
            # Создаем приложение
            self.application = Application.builder().token(self.token).build()
            
            # Добавляем обработчики
            self.application.add_handler(CommandHandler("start", self.start_command))
            self.application.add_handler(CommandHandler("help", self.help_command))
            self.application.add_handler(CommandHandler("stats", self.stats_command))
            self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
            self.application.add_error_handler(self.error_handler)
            
            # Запускаем бота
            await self.application.initialize()
            await self.application.start()
            await self.application.updater.start_polling()
            
            self.is_running = True
            logger.info("Telegram bot started successfully")
            
        except Exception as e:
            logger.error(f"Error starting Telegram bot: {e}", exc_info=True)
            self.is_running = False
            raise
    
    async def stop(self):
        """Остановка бота"""
        try:
            if self.application and self.is_running:
                logger.info("Stopping Telegram bot...")
                
                await self.application.updater.stop()
                await self.application.stop()
                await self.application.shutdown()
                
                self.is_running = False
                logger.info("Telegram bot stopped")
                
        except Exception as e:
            logger.error(f"Error stopping Telegram bot: {e}", exc_info=True)
    
    def get_status(self) -> dict:
        """Получить статус бота"""
        return {
            "is_running": self.is_running,
            "token_configured": bool(self.token)
        }


# Глобальный экземпляр бота
_bot_instance: Optional[TelegramBot] = None


def get_bot_instance() -> Optional[TelegramBot]:
    """Получить экземпляр бота"""
    return _bot_instance


def set_bot_instance(bot: TelegramBot):
    """Установить экземпляр бота"""
    global _bot_instance
    _bot_instance = bot


async def start_telegram_bot(token: str, settings_manager: SettingsManager) -> TelegramBot:
    """
    Запустить Telegram бота
    
    Args:
        token: Telegram Bot Token
        settings_manager: Менеджер настроек
    
    Returns:
        Экземпляр бота
    """
    bot = TelegramBot(token, settings_manager)
    await bot.start()
    set_bot_instance(bot)
    return bot


async def stop_telegram_bot():
    """Остановить Telegram бота"""
    bot = get_bot_instance()
    if bot:
        await bot.stop()
        set_bot_instance(None)
