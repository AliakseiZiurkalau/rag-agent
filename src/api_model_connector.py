"""Connector for external API models (OpenAI, Anthropic, etc.)"""
import requests
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class APIModelConnector:
    """Connector for external LLM APIs"""
    
    def __init__(self, api_type: str, api_key: str, api_url: str = None, model_name: str = None):
        """
        Initialize API connector
        
        Args:
            api_type: Type of API (openai, anthropic, gemini, custom)
            api_key: API key
            api_url: Custom API URL (optional)
            model_name: Model name
        """
        self.api_type = api_type
        self.api_key = api_key
        self.model_name = model_name
        
        # Set default URLs
        if api_url:
            self.api_url = api_url
        elif api_type == 'openai':
            self.api_url = 'https://api.openai.com/v1'
        elif api_type == 'anthropic':
            self.api_url = 'https://api.anthropic.com/v1'
        elif api_type == 'gemini':
            self.api_url = 'https://generativelanguage.googleapis.com/v1beta'
        else:
            self.api_url = api_url or 'http://localhost:8000/v1'
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 256) -> str:
        """
        Generate response using external API
        
        Args:
            prompt: Input prompt
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated text
            
        Raises:
            Exception: If API call fails
        """
        if self.api_type == 'openai':
            return self._generate_openai(prompt, temperature, max_tokens)
        elif self.api_type == 'anthropic':
            return self._generate_anthropic(prompt, temperature, max_tokens)
        elif self.api_type == 'gemini':
            return self._generate_gemini(prompt, temperature, max_tokens)
        else:
            return self._generate_custom(prompt, temperature, max_tokens)
    
    def _generate_openai(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model_name or 'gpt-3.5-turbo',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        response = requests.post(
            f"{self.api_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def _generate_anthropic(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using Anthropic API"""
        headers = {
            'x-api-key': self.api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model_name or 'claude-3-sonnet-20240229',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        response = requests.post(
            f"{self.api_url}/messages",
            headers=headers,
            json=data,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        return result['content'][0]['text']
    
    def _generate_gemini(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using Google Gemini API"""
        # Gemini использует API key в URL
        # Добавляем префикс models/ если его нет
        model_name = self.model_name
        if not model_name.startswith('models/'):
            model_name = f'models/{model_name}'
        
        url = f"{self.api_url}/{model_name}:generateContent?key={self.api_key}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        data = {
            'contents': [{
                'parts': [{
                    'text': prompt
                }]
            }],
            'generationConfig': {
                'temperature': temperature,
                'maxOutputTokens': max_tokens,
                # Отключаем thinking для Gemini 2.5, чтобы токены шли на ответ
                'responseModalities': ['TEXT']
            }
        }
        
        # Логируем запрос
        logger.debug(f"Gemini request - Model: {model_name}, Prompt length: {len(prompt)}, Temperature: {temperature}, MaxTokens: {max_tokens}")
        logger.debug(f"Gemini prompt preview: {prompt[:200]}...")
        
        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        
        # Логируем ответ для отладки
        logger.debug(f"Gemini response: {result}")
        
        # Проверяем наличие candidates
        if 'candidates' not in result or not result['candidates']:
            # Проверяем, есть ли информация о блокировке
            if 'promptFeedback' in result:
                feedback = result['promptFeedback']
                if 'blockReason' in feedback:
                    raise ValueError(f"Запрос заблокирован: {feedback['blockReason']}")
            raise ValueError(f"Нет ответа от модели. Возможно, запрос заблокирован фильтрами безопасности.")
        
        candidate = result['candidates'][0]
        
        # Проверяем finishReason
        finish_reason = candidate.get('finishReason', 'UNKNOWN')
        
        # Если модель остановилась из-за безопасности
        if finish_reason == 'SAFETY':
            safety_ratings = candidate.get('safetyRatings', [])
            blocked_categories = [r['category'] for r in safety_ratings if r.get('blocked', False)]
            if blocked_categories:
                raise ValueError(f"Ответ заблокирован фильтрами безопасности: {', '.join(blocked_categories)}")
            raise ValueError("Ответ заблокирован фильтрами безопасности")
        
        # Если модель остановилась из-за других причин
        if finish_reason not in ['STOP', 'MAX_TOKENS']:
            raise ValueError(f"Генерация остановлена: {finish_reason}")
        
        # Проверяем структуру ответа
        if 'content' not in candidate:
            raise ValueError(f"Нет контента в ответе. FinishReason: {finish_reason}")
        
        content = candidate['content']
        
        # Проверяем наличие parts
        if 'parts' not in content or not content['parts']:
            # Если parts пустой, но есть role, это может быть пустой ответ
            if 'role' in content and content['role'] == 'model':
                raise ValueError("Модель вернула пустой ответ. Попробуйте переформулировать запрос.")
            raise ValueError(f"Нет текста в ответе. Content: {content}")
        
        # Получаем текст из первой части
        first_part = content['parts'][0]
        if 'text' not in first_part:
            raise ValueError(f"Нет текста в части ответа: {first_part}")
        
        return first_part['text']
    
    def _generate_custom(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using custom API (OpenAI-compatible)"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model_name,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        response = requests.post(
            f"{self.api_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def test_connection(self) -> bool:
        """Test API connection"""
        try:
            test_prompt = "Hello"
            result = self.generate(test_prompt, temperature=0.1, max_tokens=10)
            return bool(result)
        except Exception as e:
            logger.error(f"API connection test failed: {e}")
            return False
