"""Document parsing for PDF and DOC files"""
from pathlib import Path
from typing import List
import PyPDF2
import docx


class DocumentParser:
    """Parse documents and extract text content"""
    
    @staticmethod
    def parse_pdf(file_path: Path) -> str:
        """Extract text from PDF file"""
        text = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return "\n".join(text)
    
    @staticmethod
    def parse_docx(file_path: Path) -> str:
        """Extract text from DOCX file"""
        doc = docx.Document(file_path)
        text = [paragraph.text for paragraph in doc.paragraphs]
        return "\n".join(text)
    
    @staticmethod
    def parse_doc(file_path: Path) -> str:
        """Extract text from DOC file (legacy format)"""
        # For legacy .doc files, consider using python-docx2txt or antiword
        raise NotImplementedError("Legacy .doc format requires additional tools")
    
    def parse_document(self, file_path: Path) -> str:
        """Parse document based on file extension"""
        suffix = file_path.suffix.lower()
        
        if suffix == '.pdf':
            return self.parse_pdf(file_path)
        elif suffix == '.docx':
            return self.parse_docx(file_path)
        elif suffix == '.doc':
            return self.parse_doc(file_path)
        else:
            raise ValueError(f"Unsupported file format: {suffix}")
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks by sentences"""
        import re
        
        # Разбиваем на предложения
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sentence_len = len(sentence)
            
            if current_size + sentence_len > chunk_size and current_chunk:
                # Сохраняем текущий чанк
                chunks.append(' '.join(current_chunk))
                
                # Начинаем новый чанк с overlap
                overlap_sentences = []
                overlap_size = 0
                for s in reversed(current_chunk):
                    if overlap_size + len(s) <= overlap:
                        overlap_sentences.insert(0, s)
                        overlap_size += len(s)
                    else:
                        break
                
                current_chunk = overlap_sentences
                current_size = overlap_size
            
            current_chunk.append(sentence)
            current_size += sentence_len
        
        # Добавляем последний чанк
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return [c for c in chunks if c.strip()]
