"""Document parsing for PDF, DOC, and Excel files"""
from pathlib import Path
from typing import List
import PyPDF2
import docx
import openpyxl
import pandas as pd


class DocumentParser:
    """Parse documents and extract text content"""
    
    @staticmethod
    def parse_pdf(file_path: Path) -> str:
        """Extract text from PDF file"""
        text = []
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text.append(page_text)
                    except Exception as e:
                        print(f"Warning: Could not extract text from page {page_num}: {e}")
                        continue
            
            result = "\n".join(text)
            if not result.strip():
                raise ValueError("PDF contains no extractable text. The file might be image-based (scanned document) or password-protected. Please use a text-based PDF or convert scanned documents using OCR.")
            return result
        except Exception as e:
            raise ValueError(f"Error parsing PDF: {str(e)}")
    
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
    
    @staticmethod
    def parse_excel(file_path: Path) -> str:
        """Extract text from Excel file (xlsx, xls)"""
        try:
            # Читаем Excel файл
            df = pd.read_excel(file_path, sheet_name=None)  # Читаем все листы
            
            text_parts = []
            for sheet_name, sheet_df in df.items():
                text_parts.append(f"=== Лист: {sheet_name} ===\n")
                
                # Конвертируем DataFrame в текст
                # Включаем заголовки столбцов
                text_parts.append(sheet_df.to_string(index=False))
                text_parts.append("\n\n")
            
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Error parsing Excel file: {str(e)}")
    
    def parse_document(self, file_path: Path) -> str:
        """Parse document based on file extension"""
        suffix = file_path.suffix.lower()
        
        if suffix == '.pdf':
            return self.parse_pdf(file_path)
        elif suffix == '.docx':
            return self.parse_docx(file_path)
        elif suffix == '.doc':
            return self.parse_doc(file_path)
        elif suffix in ['.xlsx', '.xls']:
            return self.parse_excel(file_path)
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
