import { useState, useEffect } from 'react'
import { Power, PowerOff, ExternalLink } from 'lucide-react'
import { telegramApi } from '../../api/client'

export default function TelegramTab() {
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramBotEnabled, setTelegramBotEnabled] = useState(false)
  const [telegramBotStatus, setTelegramBotStatus] = useState<'stopped' | 'running' | 'error'>('stopped')
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Загрузка статуса бота при монтировании
  useEffect(() => {
    loadBotStatus()
  }, [])

  const loadBotStatus = async () => {
    try {
      const botStatus = await telegramApi.status()
      setTelegramBotEnabled(botStatus.is_running)
      setTelegramBotStatus(botStatus.is_running ? 'running' : 'stopped')
    } catch (error) {
      console.error('Error loading Telegram status:', error)
    }
  }

  const handleStartBot = async () => {
    if (!telegramBotToken.trim()) {
      setStatus({ message: '✗ Введите токен бота', type: 'error' })
      return
    }

    setIsLoading(true)
    setStatus({ message: '⏳ Запуск бота...', type: 'loading' })

    try {
      await telegramApi.start({ bot_token: telegramBotToken })
      setTelegramBotEnabled(true)
      setTelegramBotStatus('running')
      setStatus({ message: '✓ Telegram бот успешно запущен!', type: 'success' })
      setTimeout(() => setStatus(null), 5000)
    } catch (error: any) {
      setTelegramBotStatus('error')
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка запуска бота'
      setStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setStatus(null), 10000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopBot = async () => {
    setIsLoading(true)
    setStatus({ message: '⏳ Остановка бота...', type: 'loading' })

    try {
      await telegramApi.stop()
      setTelegramBotStatus('stopped')
      setTelegramBotEnabled(false)
      setStatus({ message: '○ Telegram бот остановлен', type: 'success' })
      setTimeout(() => setStatus(null), 5000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка остановки бота'
      setStatus({ message: `✗ ${errorMessage}`, type: 'error' })
      setTimeout(() => setStatus(null), 10000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">🤖 Telegram Bot</h2>
            <p className="text-gray-600">
              Подключите RAG агента к Telegram для ответов на вопросы прямо в мессенджере
            </p>
          </div>
          
          {/* Status Badge */}
          {telegramBotEnabled && (
            <div className={`px-4 py-2 rounded-lg border ${
              telegramBotStatus === 'running' ? 'bg-green-50 border-green-200' :
              telegramBotStatus === 'error' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xl ${
                  telegramBotStatus === 'running' ? 'text-green-500' :
                  telegramBotStatus === 'error' ? 'text-red-500' :
                  'text-gray-500'
                }`}>●</span>
                <span className="font-medium text-sm">
                  {telegramBotStatus === 'running' ? 'Работает' :
                   telegramBotStatus === 'error' ? 'Ошибка' :
                   'Остановлен'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h3 className="text-xl font-semibold">⚙️ Настройка</h3>

        {/* Token Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Telegram Bot Token
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="password"
            value={telegramBotToken}
            onChange={(e) => setTelegramBotToken(e.target.value)}
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            disabled={telegramBotStatus === 'running'}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-600 mt-2">
            Получите токен у{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              @BotFather
              <ExternalLink className="w-3 h-3" />
            </a>
            {' '}в Telegram
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {telegramBotStatus !== 'running' ? (
            <button
              onClick={handleStartBot}
              disabled={!telegramBotToken.trim() || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              <Power className="w-5 h-5" />
              Запустить бота
            </button>
          ) : (
            <button
              onClick={handleStopBot}
              disabled={isLoading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              <PowerOff className="w-5 h-5" />
              Остановить бота
            </button>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div className={`
            p-4 rounded-lg text-sm
            ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
            ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
            ${status.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
          `}>
            {status.message}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">📝 Инструкция по настройке</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Создайте бота в Telegram</h4>
              <p className="text-sm text-gray-600">
                Откройте Telegram и найдите{' '}
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  @BotFather
                </a>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Получите токен</h4>
              <p className="text-sm text-gray-600">
                Отправьте команду <code className="bg-gray-100 px-2 py-1 rounded">/newbot</code> и следуйте инструкциям
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Запустите бота</h4>
              <p className="text-sm text-gray-600">
                Вставьте токен в поле выше и нажмите "Запустить бота"
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-medium mb-1">Начните диалог</h4>
              <p className="text-sm text-gray-600">
                Найдите вашего бота в Telegram и отправьте команду <code className="bg-gray-100 px-2 py-1 rounded">/start</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">✨ Возможности бота</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <span className="text-2xl">💬</span>
            <div>
              <h4 className="font-medium mb-1">Ответы на вопросы</h4>
              <p className="text-sm text-gray-600">
                Получайте ответы по загруженным документам
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <span className="text-2xl">🔍</span>
            <div>
              <h4 className="font-medium mb-1">Поиск информации</h4>
              <p className="text-sm text-gray-600">
                Быстрый поиск в базе знаний
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-medium mb-1">Статистика</h4>
              <p className="text-sm text-gray-600">
                Команда /stats для просмотра статистики
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="font-medium mb-1">Быстрые ответы</h4>
              <p className="text-sm text-gray-600">
                Ответы в реальном времени
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">🎮 Команды бота</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <code className="bg-gray-200 px-3 py-1 rounded font-mono text-sm">/start</code>
            <span className="text-gray-600">Начать работу с ботом</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <code className="bg-gray-200 px-3 py-1 rounded font-mono text-sm">/help</code>
            <span className="text-gray-600">Показать справку</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <code className="bg-gray-200 px-3 py-1 rounded font-mono text-sm">/stats</code>
            <span className="text-gray-600">Статистика системы</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Важная информация</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Токен хранится только в памяти и не сохраняется между перезапусками</li>
          <li>• Бот использует ту же модель и настройки, что и основное приложение</li>
          <li>• Для работы бота необходимо подключение к интернету</li>
          <li>• Бот отвечает только на текстовые сообщения</li>
        </ul>
      </div>
    </div>
  )
}
