const API_BASE = '';
let isProcessing = false;

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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadStats();
    setupEventListeners();
    
    // Периодическая проверка статуса
    setInterval(checkHealth, 30000);
});

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
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showUploadStatus('Поддерживаются только PDF и DOCX файлы', 'error');
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
        
        loadStats();
        
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
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка запроса');
        }
        
        const data = await response.json();
        
        // Удаление индикатора загрузки
        removeLoadingIndicator(loadingId);
        
        // Добавление ответа
        addMessage('assistant', data.answer, data.sources_count);
        
    } catch (error) {
        removeLoadingIndicator(loadingId);
        addMessage('assistant', `Ошибка: ${error.message}`, 0);
    }
    
    isProcessing = false;
    sendButton.disabled = false;
    questionInput.focus();
}

// Добавление сообщения в чат
function addMessage(role, content, sourcesCount = null) {
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
    
    if (sourcesCount !== null && sourcesCount > 0) {
        html += `
            <div class="message-sources">
                <strong>📄 Источников:</strong> ${sourcesCount}
            </div>
        `;
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
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}

// Удаление индикатора загрузки
function removeLoadingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
