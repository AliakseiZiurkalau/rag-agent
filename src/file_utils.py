"""File utilities for RAG agent"""
import hashlib
from pathlib import Path
from typing import Tuple


def generate_safe_filename(original_filename: str, content: bytes) -> Tuple[str, str]:
    """
    Generate safe filename with hash prefix
    
    Args:
        original_filename: Original file name
        content: File content bytes
    
    Returns:
        Tuple of (safe_filename, file_hash)
    """
    file_hash = hashlib.md5(content).hexdigest()[:8]
    safe_filename = f"{file_hash}_{original_filename}"
    return safe_filename, file_hash


def save_file(file_path: Path, content: bytes) -> None:
    """
    Save file to disk
    
    Args:
        file_path: Path where to save file
        content: File content bytes
    """
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'wb') as f:
        f.write(content)


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: Size in bytes
    
    Returns:
        Formatted string (e.g., "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
