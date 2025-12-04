"""Cache manager for RAG agent"""
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta


class CacheManager:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self, ttl: int = 3600):
        """
        Initialize cache manager
        
        Args:
            ttl: Time to live in seconds (default: 1 hour)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl
    
    def _generate_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        if datetime.now() > entry['expires_at']:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any) -> None:
        """Set value in cache"""
        self.cache[key] = {
            'value': value,
            'expires_at': datetime.now() + timedelta(seconds=self.ttl)
        }
    
    def get_by_text(self, text: str) -> Optional[Any]:
        """Get value from cache by text (generates key automatically)"""
        key = self._generate_key(text)
        return self.get(key)
    
    def set_by_text(self, text: str, value: Any) -> None:
        """Set value in cache by text (generates key automatically)"""
        key = self._generate_key(text)
        self.set(key, value)
    
    def clear(self) -> None:
        """Clear all cache"""
        self.cache.clear()
    
    def size(self) -> int:
        """Get cache size"""
        return len(self.cache)
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count of removed items"""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)
