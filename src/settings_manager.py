"""Settings manager for RAG agent"""
import json
from pathlib import Path
from typing import Dict, Any


class SettingsManager:
    """Manage application settings"""
    
    def __init__(self, settings_file: Path = None):
        """Initialize settings manager"""
        if settings_file is None:
            settings_file = Path(__file__).parent.parent / "data" / "settings.json"
        
        self.settings_file = settings_file
        self.settings_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Default settings
        self.defaults = {
            "model": "llama3.2:1b",
            "temperature": 0.1,
            "num_predict": 80,
            "num_ctx": 512,
            "context_length": 300,
            "top_k": 10,
            "top_p": 0.5,
            "repeat_penalty": 1.1
        }
        
        # Load or create settings
        self.settings = self.load()
    
    def load(self) -> Dict[str, Any]:
        """Load settings from file"""
        if self.settings_file.exists():
            try:
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                    # Merge with defaults
                    return {**self.defaults, **loaded}
            except Exception as e:
                print(f"Error loading settings: {e}")
                return self.defaults.copy()
        return self.defaults.copy()
    
    def save(self, settings: Dict[str, Any] = None) -> bool:
        """Save settings to file"""
        try:
            if settings:
                self.settings.update(settings)
            
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving settings: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get setting value"""
        return self.settings.get(key, default)
    
    def set(self, key: str, value: Any) -> bool:
        """Set setting value"""
        self.settings[key] = value
        return self.save()
    
    def reset(self) -> bool:
        """Reset to default settings"""
        self.settings = self.defaults.copy()
        return self.save()
