"""Simple cache implementation with TTL"""
import time
from typing import Any, Optional, Dict
from threading import Lock


class SimpleCache:
    """Thread-safe cache with TTL support"""
    
    def __init__(self, ttl: int = 3600):
        """Initialize cache with TTL in seconds"""
        self.ttl = ttl
        self.cache: Dict[str, tuple[Any, float]] = {}
        self.lock = Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self.lock:
            if key in self.cache:
                value, timestamp = self.cache[key]
                if time.time() - timestamp < self.ttl:
                    return value
                else:
                    del self.cache[key]
        return None
    
    def set(self, key: str, value: Any) -> None:
        """Set value in cache with current timestamp"""
        with self.lock:
            self.cache[key] = (value, time.time())
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
    
    def cleanup(self) -> int:
        """Remove expired entries and return count"""
        with self.lock:
            current_time = time.time()
            expired_keys = [
                key for key, (_, timestamp) in self.cache.items()
                if current_time - timestamp >= self.ttl
            ]
            for key in expired_keys:
                del self.cache[key]
            return len(expired_keys)
