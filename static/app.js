const API_BASE = '';
let isProcessing = false;
let uploadedDocuments = [];

// DOM элементы
const statusEl = document.getElementById('status');
const statusTextEl = document.getElementById('status-text');
const statsEl = document.getElementById('stats');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const chatContainer = document.getElementById('chat-container');
const questionInput = document.getElementById('question-input');
const sendButton = document.getElementById('send-button');
const documentsList = document.getElementById('documents-list');
const clearDocsButton = document.getElementById('clear-docs-button');
const clearChatButton = document.getElementById('clear-chat-button');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadStats();
    setupEventListeners();
    setupTabs();
    loadDocumentsList();
    setupSettings();
    setupXWiki();
    
    // Периодическая проверка статуса
    setInterval(checkHealth, 30000);
});

// Настройка вкладок
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Убираем активный класс со всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс к выбранной вкладке
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Проверка здоровья системы
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            statusEl.className = 'status online';
            statusTextEl.textContent = 'Система работает';
            sendButton.disabled = false;
        } else {
            statusEl.className = 'status offline';
            statusTextEl.textContent = 'Система недоступна';
            sendButton.disabled = true;
        }
    } catch (error) {
        statusEl.className = 'status offline';
        statusTextEl.textContent = 'Ошибка подключения';
        sendButton.disabled = true;
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        statsEl.textContent = `📚 Документов: ${data.documents_count} | 🔍 Топ-K: ${data.top_k_results}`;
        
        // Обновляем список документов
        await loadDocumentsList();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка файлов
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // Отправка сообщений
    sendButton.addEventListener('click', sendMessage);
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Автоматическое изменение высоты textarea
    questionInput.addEventListener('input', () => {
        questionInput.style.height = 'auto';
        questionInput.style.height = questionInput.scrollHeight + 'px';
    });
    
    // Очистка документов
    clearDocsButton.addEventListener('click', clearAllDocuments);
    
    // Очистка чата
    clearChatButton.addEventListener('click', clearChat);
}

// Обработка выбора файла
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
}

// Загрузка файла
async function handleFileUpload(file) {
    // Проверка типа файла
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    if (!allowedTypes.includes(file.type)) {
        showUploadStatus('Поддерживаются только PDF, DOCX и Excel файлы', 'error');
        return;
    }
    
    // Проверка размера
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showUploadStatus('Файл слишком большой. Максимум 10MB', 'error');
        return;
    }
    
    showUploadStatus(`Загрузка ${file.name}...`, 'loading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка загрузки');
        }
        
        const data = await response.json();
        showUploadStatus(
            `✓ ${file.name} загружен. Создано чанков: ${data.chunks_created}`,
            'success'
        );
        
        // Добавляем документ в список
        uploadedDocuments.push({
            filename: data.filename,
            file_hash: data.file_hash,
            chunks_created: data.chunks_created,
            text_length: data.text_length,
            uploaded_at: new Date().toISOString()
        });
        
        loadStats();
        renderDocumentsList();
        
        // Очистка welcome message при первой загрузке
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
    } catch (error) {
        showUploadStatus(`✗ Ошибка: ${error.message}`, 'error');
    }
    
    fileInput.value = '';
}

// Показ статуса загрузки
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            uploadStatus.className = 'upload-status';
        }, 5000);
    }
}

// Отправка сообщения
async function sendMessage() {
    const question = questionInput.value.trim();
    
    if (!question || isProcessing) return;
    
    isProcessing = true;
    sendButton.disabled = true;
    
    // Очистка welcome message
    const welcomeMsg = chatContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Добавление вопроса пользователя
    addMessage('user', question);
    questionInput.value = '';
    questionInput.style.height = 'auto';
    
    // Показ индикатора загрузки
    const loadingId = addLoadingIndicator();
    
    try {
        // Создаем контроллер для отмены запроса с таймаутом 10 минут
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 минут
        
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка запроса');
        }
        
        const data = await response.json();
        
        // Удаление индикатора загрузки
        removeLoadingIndicator(loadingId);
        
        // Добавление ответа
        addMessage('assistant', data.answer, data.sources);
        
    } catch (error) {
        removeLoadingIndicator(loadingId);
        addMessage('assistant', `Ошибка: ${error.message}`, null);
    }
    
    isProcessing = false;
    sendButton.disabled = false;
    questionInput.focus();
}

// Добавление сообщения в чат
function addMessage(role, content, sources = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const icon = role === 'user' ? '👤' : '🤖';
    const label = role === 'user' ? 'Вы' : 'Ассистент';
    
    let html = `
        <div class="message-header">
            <span>${icon}</span>
            <span>${label}</span>
        </div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;
    
    if (sources && sources.length > 0) {
        html += `
            <div class="message-sources">
                <strong>📄 Источники:</strong>
                <ul class="sources-list">
                    ${sources.map((source, index) => `
                        <li>
                            <span class="source-icon">📄</span>
                            <span class="source-name source-link" onclick="openSourceModal(${index})">${escapeHtml(source.filename)}</span>
                            ${source.chunks ? `<span class="source-chunk">(${source.chunks.length} фрагмент${source.chunks.length > 1 ? 'ов' : ''})</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        // Сохраняем источники для модального окна
        messageDiv.dataset.sources = JSON.stringify(sources);
    }
    
    messageDiv.innerHTML = html;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Добавление индикатора загрузки
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    const id = 'loading-' + Date.now();
    loadingDiv.id = id;
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = `
        <div class="message-header">
            <span>🤖</span>
            <span>Ассистент</span>
        </div>
        <div class="message-content">
            <div class="loading-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                Обработка запроса... Это может занять до 3 минут
            </div>
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Обновляем сообщение каждые 30 секунд
    const startTime = Date.now();
    const intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const statusDiv = loadingDiv.querySelector('div[style*="margin-top"]');
        if (statusDiv) {
            statusDiv.textContent = `Обработка запроса... Прошло ${elapsed} секунд`;
        }
    }, 5000);
    
    loadingDiv.dataset.intervalId = intervalId;
    return id;
}

// Удаление индикатора загрузки
function removeLoadingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        const intervalId = element.dataset.intervalId;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
        }
        element.remove();
    }
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Загрузка списка документов
async function loadDocumentsList() {
    try {
        const response = await fetch(`${API_BASE}/documents`);
        const data = await response.json();
        
        uploadedDocuments = data.documents.map(doc => ({
            filename: doc.filename,
            file_hash: doc.file_hash,
            chunks_created: doc.chunks_count,
            text_length: doc.text_length || 0,
            uploaded_at: new Date().toISOString()
        }));
        
        renderDocumentsList();
    } catch (error) {
        console.error('Error loading documents:', error);
        uploadedDocuments = [];
        renderDocumentsList();
    }
}

// Отрисовка списка документов
function renderDocumentsList() {
    if (uploadedDocuments.length === 0) {
        documentsList.innerHTML = '<p class="empty-message">Документы еще не загружены</p>';
        return;
    }
    
    documentsList.innerHTML = uploadedDocuments.map((doc, index) => `
        <div class="document-item">
            <div class="document-info">
                <div class="document-name">📄 ${escapeHtml(doc.filename)}</div>
                <div class="document-meta">
                    Чанков: ${doc.chunks_created} | Размер: ${formatBytes(doc.text_length)}
                </div>
            </div>
            <div class="document-actions">
                <button class="doc-button info" onclick="showDocumentInfo(${index})">
                    ℹ️ Инфо
                </button>
            </div>
        </div>
    `).join('');
}

// Форматирование размера файла
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Показать информацию о документе
function showDocumentInfo(index) {
    const doc = uploadedDocuments[index];
    const uploadDate = new Date(doc.uploaded_at).toLocaleString('ru-RU');
    alert(`Документ: ${doc.filename}\n\nЧанков: ${doc.chunks_created}\nРазмер текста: ${formatBytes(doc.text_length)}\nЗагружен: ${uploadDate}\nХеш: ${doc.file_hash}`);
}

// Очистка всех документов
async function clearAllDocuments() {
    if (!confirm('Вы уверены, что хотите удалить все документы из базы данных?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/clear`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при очистке базы данных');
        }
        
        uploadedDocuments = [];
        renderDocumentsList();
        loadStats();
        clearChat();
        
        showUploadStatus('✓ Все документы удалены', 'success');
    } catch (error) {
        showUploadStatus(`✗ Ошибка: ${error.message}`, 'error');
    }
}

// Очистка чата
function clearChat() {
    chatContainer.innerHTML = `
        <div class="welcome-message">
            <h3>Добро пожаловать!</h3>
            <p>Загрузите документы и задавайте вопросы. Я помогу найти нужную информацию.</p>
        </div>
    `;
}

// Настройки
let currentSettings = {};

function setupSettings() {
    loadSettings();
    
    // Обработчики для слайдеров
    const temperature = document.getElementById('temperature');
    const numPredict = document.getElementById('num-predict');
    const numCtx = document.getElementById('num-ctx');
    const contextLength = document.getElementById('context-length');
    
    temperature.addEventListener('input', (e) => {
        document.getElementById('temperature-value').textContent = e.target.value;
    });
    
    numPredict.addEventListener('input', (e) => {
        document.getElementById('num-predict-value').textContent = e.target.value;
    });
    
    numCtx.addEventListener('input', (e) => {
        document.getElementById('num-ctx-value').textContent = e.target.value;
    });
    
    contextLength.addEventListener('input', (e) => {
        document.getElementById('context-length-value').textContent = e.target.value;
    });
    
    // Кнопки
    document.getElementById('save-settings-button').addEventListener('click', saveSettings);
    document.getElementById('reset-settings-button').addEventListener('click', resetSettings);
}

async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();
        
        currentSettings = data;
        
        // Устанавливаем значения
        document.getElementById('model-select').value = data.model || 'llama3.2:1b';
        document.getElementById('temperature').value = data.temperature || 0.1;
        document.getElementById('num-predict').value = data.num_predict || 80;
        document.getElementById('num-ctx').value = data.num_ctx || 512;
        document.getElementById('context-length').value = data.context_length || 300;
        
        // Обновляем отображаемые значения
        document.getElementById('temperature-value').textContent = data.temperature || 0.1;
        document.getElementById('num-predict-value').textContent = data.num_predict || 80;
        document.getElementById('num-ctx-value').textContent = data.num_ctx || 512;
        document.getElementById('context-length-value').textContent = data.context_length || 300;
        
        // Статус модели
        document.getElementById('model-status').textContent = `Модель: ${data.model} | URL: ${data.ollama_url}`;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showSettingsStatus('Ошибка загрузки настроек', 'error');
    }
}

async function saveSettings() {
    try {
        const settings = {
            model: document.getElementById('model-select').value,
            temperature: parseFloat(document.getElementById('temperature').value),
            num_predict: parseInt(document.getElementById('num-predict').value),
            num_ctx: parseInt(document.getElementById('num-ctx').value),
            context_length: parseInt(document.getElementById('context-length').value)
        };
        
        const response = await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка сохранения настроек');
        }
        
        const data = await response.json();
        showSettingsStatus('✓ Настройки сохранены! Перезапустите сервер для применения изменений.', 'success');
        
        // Обновляем текущие настройки
        currentSettings = settings;
        
        // Перезагружаем настройки для обновления статуса
        await loadSettings();
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsStatus(`✗ Ошибка: ${error.message}`, 'error');
    }
}

function resetSettings() {
    // Сбрасываем к значениям по умолчанию
    document.getElementById('model-select').value = 'llama3.2:1b';
    document.getElementById('temperature').value = 0.1;
    document.getElementById('num-predict').value = 80;
    document.getElementById('num-ctx').value = 512;
    document.getElementById('context-length').value = 300;
    
    document.getElementById('temperature-value').textContent = '0.1';
    document.getElementById('num-predict-value').textContent = '80';
    document.getElementById('num-ctx-value').textContent = '512';
    document.getElementById('context-length-value').textContent = '300';
    
    showSettingsStatus('Настройки сброшены к значениям по умолчанию', 'success');
}

function showSettingsStatus(message, type) {
    const statusEl = document.getElementById('settings-status');
    statusEl.textContent = message;
    statusEl.className = `settings-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.className = 'settings-status';
        }, 5000);
    }
}

// XWiki Integration
function setupXWiki() {
    document.getElementById('test-xwiki-button').addEventListener('click', testXWikiConnection);
    document.getElementById('import-xwiki-button').addEventListener('click', importFromXWiki);
}

async function testXWikiConnection() {
    try {
        const config = {
            base_url: document.getElementById('xwiki-url').value,
            username: document.getElementById('xwiki-username').value || null,
            password: document.getElementById('xwiki-password').value || null,
            wiki: document.getElementById('xwiki-wiki').value || 'xwiki'
        };
        
        if (!config.base_url) {
            showXWikiStatus('Введите URL XWiki', 'error');
            return;
        }
        
        showXWikiStatus('Проверка подключения...', 'loading');
        
        const response = await fetch(`${API_BASE}/xwiki/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка подключения');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showXWikiStatus(`✓ ${data.message}. Найдено пространств: ${data.spaces.length}`, 'success');
            
            // Показываем список пространств
            const spacesList = document.getElementById('xwiki-spaces-list');
            spacesList.innerHTML = data.spaces.map(space => `<li>${space}</li>`).join('');
            document.getElementById('xwiki-spaces').style.display = 'block';
        } else {
            showXWikiStatus(`✗ ${data.message}`, 'error');
        }
        
    } catch (error) {
        console.error('Error testing XWiki connection:', error);
        showXWikiStatus(`✗ Ошибка: ${error.message}`, 'error');
    }
}

async function importFromXWiki() {
    try {
        const config = {
            base_url: document.getElementById('xwiki-url').value,
            username: document.getElementById('xwiki-username').value || null,
            password: document.getElementById('xwiki-password').value || null,
            wiki: document.getElementById('xwiki-wiki').value || 'xwiki',
            space: document.getElementById('xwiki-space').value || null
        };
        
        if (!config.base_url) {
            showXWikiStatus('Введите URL XWiki', 'error');
            return;
        }
        
        if (!confirm('Импортировать страницы из XWiki? Это может занять некоторое время.')) {
            return;
        }
        
        showXWikiStatus('Импорт страниц... Пожалуйста, подождите.', 'loading');
        
        const response = await fetch(`${API_BASE}/xwiki/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка импорта');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showXWikiStatus(`✓ ${data.message}`, 'success');
            
            // Обновляем статистику
            await loadStats();
            
            // Переключаемся на вкладку документов
            setTimeout(() => {
                document.querySelector('[data-tab="documents"]').click();
            }, 2000);
        } else {
            showXWikiStatus(`⚠ ${data.message}`, 'error');
        }
        
    } catch (error) {
        console.error('Error importing from XWiki:', error);
        showXWikiStatus(`✗ Ошибка: ${error.message}`, 'error');
    }
}

function showXWikiStatus(message, type) {
    const statusEl = document.getElementById('xwiki-status');
    statusEl.textContent = message;
    statusEl.className = `settings-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.className = 'settings-status';
        }, 10000);
    }
}

// Модальное окно для источников
let currentSourceData = null;
let currentChunkIndex = 0;

function openSourceModal(sourceIndex) {
    // Находим последнее сообщение ассистента с источниками
    const messages = document.querySelectorAll('.message.assistant');
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || !lastMessage.dataset.sources) {
        return;
    }
    
    const sources = JSON.parse(lastMessage.dataset.sources);
    const source = sources[sourceIndex];
    
    if (!source) {
        return;
    }
    
    currentSourceData = source;
    currentChunkIndex = 0;
    
    // Обновляем модальное окно
    document.getElementById('modal-source-title').textContent = source.filename;
    updateModalContent();
    
    // Показываем модальное окно
    document.getElementById('source-modal').classList.add('active');
    
    // Закрытие по клику вне окна
    document.getElementById('source-modal').onclick = function(e) {
        if (e.target === this) {
            closeSourceModal();
        }
    };
}

function closeSourceModal() {
    document.getElementById('source-modal').classList.remove('active');
    currentSourceData = null;
    currentChunkIndex = 0;
}

function navigateChunk(direction) {
    if (!currentSourceData || !currentSourceData.chunks) {
        return;
    }
    
    const newIndex = currentChunkIndex + direction;
    
    if (newIndex >= 0 && newIndex < currentSourceData.chunks.length) {
        currentChunkIndex = newIndex;
        updateModalContent();
    }
}

function updateModalContent() {
    if (!currentSourceData || !currentSourceData.chunks) {
        return;
    }
    
    const chunks = currentSourceData.chunks;
    const currentChunk = chunks[currentChunkIndex];
    
    // Обновляем контент
    document.getElementById('modal-source-content').textContent = currentChunk.content;
    
    // Обновляем индикатор
    document.getElementById('chunk-indicator').textContent = 
        `Фрагмент ${currentChunkIndex + 1} из ${chunks.length}`;
    
    // Обновляем кнопки навигации
    document.getElementById('prev-chunk').disabled = currentChunkIndex === 0;
    document.getElementById('next-chunk').disabled = currentChunkIndex === chunks.length - 1;
}

// Закрытие модального окна по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSourceModal();
    }
});
