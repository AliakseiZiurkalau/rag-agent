export type Language = 'en' | 'ru' | 'pl'

export interface Translations {
  // Header
  appTitle: string
  appSubtitle: string
  systemOnline: string
  systemOffline: string
  documentsCount: string
  topK: string
  
  // Menu
  menuSettings: string
  menuChat: string
  
  // Settings Menu Items
  settingsXWiki: string
  settingsDocuments: string
  settingsWeb: string
  settingsSystem: string
  
  // XWiki Tab
  xwikiTitle: string
  xwikiConnectionSettings: string
  xwikiUrl: string
  xwikiUsername: string
  xwikiPassword: string
  xwikiWiki: string
  xwikiSpace: string
  xwikiTestConnection: string
  xwikiImportPages: string
  xwikiAvailableSpaces: string
  xwikiOptional: string
  xwikiLeaveEmpty: string
  
  // Web Import Tab
  webTitle: string
  webUrl: string
  webSiteName: string
  webMaxPages: string
  webTestUrl: string
  webImportPages: string
  webUrlPlaceholder: string
  webSiteNamePlaceholder: string
  
  // Documents Tab
  documentsTitle: string
  documentsUpload: string
  documentsDragDrop: string
  documentsSelectFile: string
  documentsSupported: string
  documentsUploaded: string
  documentsClearAll: string
  documentsEmpty: string
  documentsChunks: string
  documentsSize: string
  documentsInfo: string
  documentsDate: string
  documentsName: string
  documentsDelete: string
  documentsConfirmDelete: string
  
  // Chat Tab
  chatTitle: string
  chatClear: string
  chatClearConfirm: string
  chatWelcome: string
  chatWelcomeText: string
  chatWelcomeDesc: string
  chatAskQuestion: string
  chatPlaceholder: string
  chatSend: string
  chatSources: string
  chatProcessing: string
  chatFragment: string
  chatOf: string
  chatPrevious: string
  chatNext: string
  chatYou: string
  chatAssistant: string
  
  // System Settings Tab
  systemSettingsTitle: string
  systemSettingsOllama: string
  systemSettingsActiveModel: string
  systemSettingsInstalledModels: string
  systemSettingsDownloadModel: string
  systemSettingsDownload: string
  systemSettingsDelete: string
  systemSettingsSize: string
  systemSettingsCustomModel: string
  systemSettingsEnterModelName: string
  
  systemSettingsAPI: string
  systemSettingsAPIType: string
  systemSettingsAPIKey: string
  systemSettingsAPIModelName: string
  systemSettingsAPIUrl: string
  systemSettingsAPIConnect: string
  systemSettingsAPIDisconnect: string
  systemSettingsAPIConnected: string
  systemSettingsAPINotUsing: string
  systemSettingsAPISaveProfile: string
  systemSettingsAPISavedProfiles: string
  systemSettingsAPIProfileName: string
  systemSettingsAPINewProfile: string
  systemSettingsAPILoadProfile: string
  systemSettingsAPIDeleteProfile: string
  systemSettingsAPINoProfiles: string
  
  systemSettingsParameters: string
  systemSettingsParametersOllamaOnly: string
  systemSettingsParametersNote: string
  systemSettingsTemperature: string
  systemSettingsMaxTokens: string
  systemSettingsContextSize: string
  systemSettingsDocContextLength: string
  systemSettingsDocContextLengthNote: string
  
  systemSettingsSave: string
  systemSettingsReset: string
  systemSettingsSaved: string
  systemSettingsResetToDefaults: string
  
  // Messages
  msgError: string
  msgSuccess: string
  msgLoading: string
  msgConfirmDelete: string
  msgConfirmClear: string
  msgConfirmDownload: string
  msgFileTooLarge: string
  msgFileTypeNotSupported: string
  msgNoDocuments: string
  msgNoModels: string
  msgPDFNoText: string
  
  // Model names
  modelFast: string
  modelQuality: string
  modelSpecialized: string
  modelOther: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appTitle: 'RAG Agent',
    appSubtitle: 'AI Assistant based on local documents',
    systemOnline: 'System online',
    systemOffline: 'System offline',
    documentsCount: 'Documents',
    topK: 'Top-K',
    
    // Menu
    menuSettings: 'Settings',
    menuChat: 'Chat',
    
    // Settings Menu Items
    settingsXWiki: 'XWiki',
    settingsDocuments: 'Documents',
    settingsWeb: 'Web Import',
    settingsSystem: 'System Settings',
    
    // XWiki Tab
    xwikiTitle: 'Import from XWiki',
    xwikiConnectionSettings: 'Connection Settings',
    xwikiUrl: 'XWiki URL:',
    xwikiUsername: 'Username (optional):',
    xwikiPassword: 'Password (optional):',
    xwikiWiki: 'Wiki:',
    xwikiSpace: 'Space (optional, leave empty for all):',
    xwikiTestConnection: 'Test Connection',
    xwikiImportPages: 'Import Pages',
    xwikiAvailableSpaces: 'Available Spaces:',
    xwikiOptional: 'optional',
    xwikiLeaveEmpty: 'leave empty for all',
    
    // Web Import Tab
    webTitle: 'Import from Website',
    webUrl: 'Website URL:',
    webSiteName: 'Site Name (optional):',
    webMaxPages: 'Maximum pages:',
    webTestUrl: 'Test URL',
    webImportPages: 'Import Pages',
    webUrlPlaceholder: 'https://example.com',
    webSiteNamePlaceholder: 'My Website',
    
    // Documents Tab
    documentsTitle: 'Upload Documents',
    documentsUpload: 'Upload',
    documentsDragDrop: 'Drag file here or',
    documentsSelectFile: 'select file',
    documentsSupported: 'Supported: PDF, DOCX and Excel files (max 50MB)',
    documentsUploaded: 'Uploaded Documents',
    documentsClearAll: 'Clear All',
    documentsEmpty: 'No documents uploaded yet',
    documentsChunks: 'Chunks',
    documentsSize: 'Size',
    documentsInfo: 'Info',
    documentsDate: 'Date',
    documentsName: 'Name',
    documentsDelete: 'Delete',
    documentsConfirmDelete: 'Delete this document?',
    
    // Chat Tab
    chatTitle: 'Chat with Assistant',
    chatClear: 'Clear Chat',
    chatClearConfirm: 'Clear chat history?',
    chatWelcome: 'Start a new conversation',
    chatWelcomeText: 'Upload documents and ask questions. I will help you find the information you need.',
    chatWelcomeDesc: 'Ask a question about uploaded documents, and I will find the answer in the knowledge base',
    chatAskQuestion: 'Ask a question...',
    chatPlaceholder: 'Ask a question...',
    chatSend: 'Send',
    chatSources: 'Sources:',
    chatProcessing: 'Processing request... This may take up to 3 minutes',
    chatFragment: 'Fragment',
    chatOf: 'of',
    chatPrevious: 'Previous',
    chatNext: 'Next',
    chatYou: 'You',
    chatAssistant: 'Assistant',
    
    // System Settings Tab
    systemSettingsTitle: 'System Settings',
    systemSettingsOllama: 'Ollama Models Management',
    systemSettingsActiveModel: 'Select active model:',
    systemSettingsInstalledModels: 'Installed models:',
    systemSettingsDownloadModel: 'Download new model:',
    systemSettingsDownload: 'Download',
    systemSettingsDelete: 'Delete',
    systemSettingsSize: 'Size',
    systemSettingsCustomModel: 'Enter manually...',
    systemSettingsEnterModelName: 'Enter model name',
    
    systemSettingsAPI: 'API Connection',
    systemSettingsAPIType: 'API Type:',
    systemSettingsAPIKey: 'API Key:',
    systemSettingsAPIModelName: 'Model Name:',
    systemSettingsAPIUrl: 'API URL (for Custom):',
    systemSettingsAPIConnect: 'Connect API',
    systemSettingsAPIDisconnect: 'Disconnect API',
    systemSettingsAPIConnected: 'Connected',
    systemSettingsAPINotUsing: 'Not using (Ollama)',
    systemSettingsAPISaveProfile: 'Save Profile',
    systemSettingsAPISavedProfiles: 'Saved Profiles',
    systemSettingsAPIProfileName: 'Profile Name',
    systemSettingsAPINewProfile: 'New Profile',
    systemSettingsAPILoadProfile: 'Load',
    systemSettingsAPIDeleteProfile: 'Delete',
    systemSettingsAPINoProfiles: 'No saved profiles',
    
    systemSettingsParameters: 'Generation Parameters',
    systemSettingsParametersOllamaOnly: '(Ollama only)',
    systemSettingsParametersNote: 'These parameters apply only to local Ollama models',
    systemSettingsTemperature: 'Temperature:',
    systemSettingsMaxTokens: 'Max Tokens:',
    systemSettingsContextSize: 'Context Size:',
    systemSettingsDocContextLength: 'Document Context Length:',
    systemSettingsDocContextLengthNote: 'Applies to all models',
    
    systemSettingsSave: 'Save Settings',
    systemSettingsReset: 'Reset',
    systemSettingsSaved: 'Settings saved!',
    systemSettingsResetToDefaults: 'Settings reset to defaults',
    
    // Messages
    msgError: 'Error',
    msgSuccess: 'Success',
    msgLoading: 'Loading',
    msgConfirmDelete: 'Delete model',
    msgConfirmClear: 'Are you sure you want to delete all documents from the database?',
    msgConfirmDownload: 'Download model',
    msgFileTooLarge: 'File too large. Max 50MB',
    msgFileTypeNotSupported: 'Only PDF, DOCX and Excel files supported',
    msgNoDocuments: 'No documents uploaded yet',
    msgNoModels: 'No models found',
    msgPDFNoText: 'PDF contains no text (might be scanned or protected)',
    
    // Model names
    modelFast: 'Fast models (1-3 GB)',
    modelQuality: 'Quality models (4-8 GB)',
    modelSpecialized: 'Specialized',
    modelOther: 'Other',
  },
  
  ru: {
    // Header
    appTitle: 'RAG Agent',
    appSubtitle: 'AI-ассистент на базе локальных документов',
    systemOnline: 'Система работает',
    systemOffline: 'Система недоступна',
    documentsCount: 'Документов',
    topK: 'Топ-K',
    
    // Menu
    menuSettings: 'Настройки',
    menuChat: 'Чат',
    
    // Settings Menu Items
    settingsXWiki: 'XWiki',
    settingsDocuments: 'Документы',
    settingsWeb: 'Импорт с веб-сайта',
    settingsSystem: 'Настройки системы',
    
    // XWiki Tab
    xwikiTitle: 'Импорт из XWiki',
    xwikiConnectionSettings: 'Настройки подключения',
    xwikiUrl: 'URL XWiki:',
    xwikiUsername: 'Имя пользователя (опционально):',
    xwikiPassword: 'Пароль (опционально):',
    xwikiWiki: 'Wiki:',
    xwikiSpace: 'Space (опционально, оставьте пустым для всех):',
    xwikiTestConnection: 'Проверить подключение',
    xwikiImportPages: 'Импортировать страницы',
    xwikiAvailableSpaces: 'Доступные пространства:',
    xwikiOptional: 'опционально',
    xwikiLeaveEmpty: 'оставьте пустым для всех',
    
    // Web Import Tab
    webTitle: 'Импорт с веб-сайта',
    webUrl: 'URL сайта:',
    webSiteName: 'Название сайта (опционально):',
    webMaxPages: 'Максимум страниц:',
    webTestUrl: 'Проверить URL',
    webImportPages: 'Импортировать страницы',
    webUrlPlaceholder: 'https://example.com',
    webSiteNamePlaceholder: 'Мой сайт',
    
    // Documents Tab
    documentsTitle: 'Загрузка документов',
    documentsUpload: 'Загрузить',
    documentsDragDrop: 'Перетащите файл сюда или',
    documentsSelectFile: 'выберите файл',
    documentsSupported: 'Поддерживаются PDF, DOCX и Excel файлы (макс. 50MB)',
    documentsUploaded: 'Загруженные документы',
    documentsClearAll: 'Очистить все',
    documentsEmpty: 'Документы еще не загружены',
    documentsChunks: 'Чанков',
    documentsSize: 'Размер',
    documentsInfo: 'Инфо',
    documentsDate: 'Дата',
    documentsName: 'Название',
    documentsDelete: 'Удалить',
    documentsConfirmDelete: 'Удалить этот документ?',
    
    // Chat Tab
    chatTitle: 'Чат с ассистентом',
    chatClear: 'Очистить',
    chatClearConfirm: 'Очистить историю чата?',
    chatWelcome: 'Начните новый диалог',
    chatWelcomeText: 'Загрузите документы и задавайте вопросы. Я помогу найти нужную информацию.',
    chatWelcomeDesc: 'Задайте вопрос по загруженным документам, и я найду ответ в базе знаний',
    chatAskQuestion: 'Задайте вопрос...',
    chatPlaceholder: 'Задайте вопрос...',
    chatSend: 'Отправить',
    chatSources: 'Источники:',
    chatProcessing: 'Обработка запроса... Это может занять до 3 минут',
    chatFragment: 'Фрагмент',
    chatOf: 'из',
    chatPrevious: 'Предыдущий',
    chatNext: 'Следующий',
    chatYou: 'Вы',
    chatAssistant: 'Ассистент',
    
    // System Settings Tab
    systemSettingsTitle: 'Настройки системы',
    systemSettingsOllama: 'Управление моделями Ollama',
    systemSettingsActiveModel: 'Выбрать активную модель:',
    systemSettingsInstalledModels: 'Установленные модели:',
    systemSettingsDownloadModel: 'Скачать новую модель:',
    systemSettingsDownload: 'Скачать',
    systemSettingsDelete: 'Удалить',
    systemSettingsSize: 'Размер',
    systemSettingsCustomModel: 'Ввести вручную...',
    systemSettingsEnterModelName: 'Введите название модели',
    
    systemSettingsAPI: 'Подключение по API',
    systemSettingsAPIType: 'Тип API:',
    systemSettingsAPIKey: 'API ключ:',
    systemSettingsAPIModelName: 'Название модели:',
    systemSettingsAPIUrl: 'API URL (для Custom):',
    systemSettingsAPIConnect: 'Подключить API',
    systemSettingsAPIDisconnect: 'Отключить API',
    systemSettingsAPIConnected: 'Подключено',
    systemSettingsAPINotUsing: 'Не использовать (Ollama)',
    systemSettingsAPISaveProfile: 'Сохранить профиль',
    systemSettingsAPISavedProfiles: 'Сохраненные профили',
    systemSettingsAPIProfileName: 'Название профиля',
    systemSettingsAPINewProfile: 'Новый профиль',
    systemSettingsAPILoadProfile: 'Загрузить',
    systemSettingsAPIDeleteProfile: 'Удалить',
    systemSettingsAPINoProfiles: 'Нет сохраненных профилей',
    
    systemSettingsParameters: 'Параметры генерации',
    systemSettingsParametersOllamaOnly: '(только для Ollama)',
    systemSettingsParametersNote: 'Эти параметры применяются только к локальным моделям Ollama',
    systemSettingsTemperature: 'Temperature:',
    systemSettingsMaxTokens: 'Максимум токенов:',
    systemSettingsContextSize: 'Размер контекста:',
    systemSettingsDocContextLength: 'Длина контекста документа:',
    systemSettingsDocContextLengthNote: 'Применяется ко всем моделям',
    
    systemSettingsSave: 'Сохранить настройки',
    systemSettingsReset: 'Сбросить',
    systemSettingsSaved: 'Настройки сохранены!',
    systemSettingsResetToDefaults: 'Настройки сброшены к значениям по умолчанию',
    
    // Messages
    msgError: 'Ошибка',
    msgSuccess: 'Успешно',
    msgLoading: 'Загрузка',
    msgConfirmDelete: 'Удалить модель',
    msgConfirmClear: 'Вы уверены, что хотите удалить все документы из базы данных?',
    msgConfirmDownload: 'Скачать модель',
    msgFileTooLarge: 'Файл слишком большой. Максимум 50MB',
    msgFileTypeNotSupported: 'Поддерживаются только PDF, DOCX и Excel файлы',
    msgNoDocuments: 'Документы еще не загружены',
    msgNoModels: 'Модели не найдены',
    msgPDFNoText: 'PDF не содержит текста (возможно отсканирован или защищен)',
    
    // Model names
    modelFast: 'Быстрые модели (1-3 GB)',
    modelQuality: 'Качественные модели (4-8 GB)',
    modelSpecialized: 'Специализированные',
    modelOther: 'Другое',
  },
  
  pl: {
    // Header
    appTitle: 'RAG Agent',
    appSubtitle: 'Asystent AI oparty na lokalnych dokumentach',
    systemOnline: 'System działa',
    systemOffline: 'System niedostępny',
    documentsCount: 'Dokumenty',
    topK: 'Top-K',
    
    // Menu
    menuSettings: 'Ustawienia',
    menuChat: 'Czat',
    
    // Settings Menu Items
    settingsXWiki: 'XWiki',
    settingsDocuments: 'Dokumenty',
    settingsWeb: 'Import z WWW',
    settingsSystem: 'Ustawienia systemu',
    
    // XWiki Tab
    xwikiTitle: 'Import z XWiki',
    xwikiConnectionSettings: 'Ustawienia połączenia',
    xwikiUrl: 'URL XWiki:',
    xwikiUsername: 'Nazwa użytkownika (opcjonalnie):',
    xwikiPassword: 'Hasło (opcjonalnie):',
    xwikiWiki: 'Wiki:',
    xwikiSpace: 'Przestrzeń (opcjonalnie, zostaw puste dla wszystkich):',
    xwikiTestConnection: 'Testuj połączenie',
    xwikiImportPages: 'Importuj strony',
    xwikiAvailableSpaces: 'Dostępne przestrzenie:',
    xwikiOptional: 'opcjonalnie',
    xwikiLeaveEmpty: 'zostaw puste dla wszystkich',
    
    // Web Import Tab
    webTitle: 'Import ze strony WWW',
    webUrl: 'URL strony:',
    webSiteName: 'Nazwa strony (opcjonalnie):',
    webMaxPages: 'Maksymalna liczba stron:',
    webTestUrl: 'Testuj URL',
    webImportPages: 'Importuj strony',
    webUrlPlaceholder: 'https://example.com',
    webSiteNamePlaceholder: 'Moja strona',
    
    // Documents Tab
    documentsTitle: 'Przesyłanie dokumentów',
    documentsUpload: 'Prześlij',
    documentsDragDrop: 'Przeciągnij plik tutaj lub',
    documentsSelectFile: 'wybierz plik',
    documentsSupported: 'Obsługiwane: pliki PDF, DOCX i Excel (maks. 50MB)',
    documentsUploaded: 'Przesłane dokumenty',
    documentsClearAll: 'Wyczyść wszystko',
    documentsEmpty: 'Nie przesłano jeszcze dokumentów',
    documentsChunks: 'Fragmenty',
    documentsSize: 'Rozmiar',
    documentsInfo: 'Info',
    documentsDate: 'Data',
    documentsName: 'Nazwa',
    documentsDelete: 'Usuń',
    documentsConfirmDelete: 'Usunąć ten dokument?',
    
    // Chat Tab
    chatTitle: 'Czat z asystentem',
    chatClear: 'Wyczyść',
    chatClearConfirm: 'Wyczyścić historię czatu?',
    chatWelcome: 'Rozpocznij nową rozmowę',
    chatWelcomeText: 'Prześlij dokumenty i zadawaj pytania. Pomogę Ci znaleźć potrzebne informacje.',
    chatWelcomeDesc: 'Zadaj pytanie o przesłane dokumenty, a znajdę odpowiedź w bazie wiedzy',
    chatAskQuestion: 'Zadaj pytanie...',
    chatPlaceholder: 'Zadaj pytanie...',
    chatSend: 'Wyślij',
    chatSources: 'Źródła:',
    chatProcessing: 'Przetwarzanie zapytania... Może to potrwać do 3 minut',
    chatFragment: 'Fragment',
    chatOf: 'z',
    chatPrevious: 'Poprzedni',
    chatNext: 'Następny',
    chatYou: 'Ty',
    chatAssistant: 'Asystent',
    
    // System Settings Tab
    systemSettingsTitle: 'Ustawienia systemu',
    systemSettingsOllama: 'Zarządzanie modelami Ollama',
    systemSettingsActiveModel: 'Wybierz aktywny model:',
    systemSettingsInstalledModels: 'Zainstalowane modele:',
    systemSettingsDownloadModel: 'Pobierz nowy model:',
    systemSettingsDownload: 'Pobierz',
    systemSettingsDelete: 'Usuń',
    systemSettingsSize: 'Rozmiar',
    systemSettingsCustomModel: 'Wprowadź ręcznie...',
    systemSettingsEnterModelName: 'Wprowadź nazwę modelu',
    
    systemSettingsAPI: 'Połączenie API',
    systemSettingsAPIType: 'Typ API:',
    systemSettingsAPIKey: 'Klucz API:',
    systemSettingsAPIModelName: 'Nazwa modelu:',
    systemSettingsAPIUrl: 'URL API (dla Custom):',
    systemSettingsAPIConnect: 'Połącz API',
    systemSettingsAPIDisconnect: 'Rozłącz API',
    systemSettingsAPIConnected: 'Połączono',
    systemSettingsAPINotUsing: 'Nie używaj (Ollama)',
    systemSettingsAPISaveProfile: 'Zapisz profil',
    systemSettingsAPISavedProfiles: 'Zapisane profile',
    systemSettingsAPIProfileName: 'Nazwa profilu',
    systemSettingsAPINewProfile: 'Nowy profil',
    systemSettingsAPILoadProfile: 'Załaduj',
    systemSettingsAPIDeleteProfile: 'Usuń',
    systemSettingsAPINoProfiles: 'Brak zapisanych profili',
    
    systemSettingsParameters: 'Parametry generowania',
    systemSettingsParametersOllamaOnly: '(tylko Ollama)',
    systemSettingsParametersNote: 'Te parametry dotyczą tylko lokalnych modeli Ollama',
    systemSettingsTemperature: 'Temperatura:',
    systemSettingsMaxTokens: 'Maks. tokeny:',
    systemSettingsContextSize: 'Rozmiar kontekstu:',
    systemSettingsDocContextLength: 'Długość kontekstu dokumentu:',
    systemSettingsDocContextLengthNote: 'Dotyczy wszystkich modeli',
    
    systemSettingsSave: 'Zapisz ustawienia',
    systemSettingsReset: 'Resetuj',
    systemSettingsSaved: 'Ustawienia zapisane!',
    systemSettingsResetToDefaults: 'Ustawienia zresetowane do domyślnych',
    
    // Messages
    msgError: 'Błąd',
    msgSuccess: 'Sukces',
    msgLoading: 'Ładowanie',
    msgConfirmDelete: 'Usuń model',
    msgConfirmClear: 'Czy na pewno chcesz usunąć wszystkie dokumenty z bazy danych?',
    msgConfirmDownload: 'Pobierz model',
    msgFileTooLarge: 'Plik za duży. Maks. 50MB',
    msgFileTypeNotSupported: 'Obsługiwane są tylko pliki PDF, DOCX i Excel',
    msgNoDocuments: 'Nie przesłano jeszcze dokumentów',
    msgNoModels: 'Nie znaleziono modeli',
    msgPDFNoText: 'PDF nie zawiera tekstu (może być zeskanowany lub chroniony)',
    
    // Model names
    modelFast: 'Szybkie modele (1-3 GB)',
    modelQuality: 'Modele jakościowe (4-8 GB)',
    modelSpecialized: 'Specjalizowane',
    modelOther: 'Inne',
  },
}
