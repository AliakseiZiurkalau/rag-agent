"""Web scraper for importing content from websites"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Set
import logging

logger = logging.getLogger(__name__)


class WebScraper:
    """Scrape and extract text content from websites"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; RAG-Agent/1.0)'
        })
    
    def fetch_page(self, url: str) -> str:
        """Fetch HTML content from URL"""
        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            raise ValueError(f"Cannot fetch page: {str(e)}")
    
    def extract_text(self, html: str, url: str) -> Dict[str, str]:
        """Extract text content from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Удаляем ненужные элементы
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()
        
        # Извлекаем заголовок
        title = soup.find('title')
        title_text = title.get_text().strip() if title else urlparse(url).path
        
        # Извлекаем основной контент
        # Пробуем найти main, article или body
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        
        if not main_content:
            raise ValueError("Cannot find main content in page")
        
        # Извлекаем текст
        text = main_content.get_text(separator='\n', strip=True)
        
        # Очищаем множественные переносы строк
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        clean_text = '\n'.join(lines)
        
        return {
            'title': title_text,
            'content': clean_text,
            'url': url
        }
    
    def get_links(self, html: str, base_url: str) -> Set[str]:
        """Extract all links from HTML page"""
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Преобразуем относительные ссылки в абсолютные
            absolute_url = urljoin(base_url, href)
            
            # Проверяем, что ссылка принадлежит тому же домену
            if urlparse(absolute_url).netloc == urlparse(base_url).netloc:
                links.add(absolute_url)
        
        return links
    
    def scrape_single_page(self, url: str) -> Dict[str, str]:
        """Scrape a single page"""
        logger.info(f"Scraping page: {url}")
        html = self.fetch_page(url)
        return self.extract_text(html, url)
    
    def scrape_website(self, start_url: str, max_pages: int = 50) -> List[Dict[str, str]]:
        """Scrape multiple pages from a website"""
        visited = set()
        to_visit = {start_url}
        results = []
        
        while to_visit and len(visited) < max_pages:
            url = to_visit.pop()
            
            if url in visited:
                continue
            
            try:
                # Скрапим страницу
                page_data = self.scrape_single_page(url)
                results.append(page_data)
                visited.add(url)
                
                # Получаем ссылки для дальнейшего скрапинга
                html = self.fetch_page(url)
                links = self.get_links(html, url)
                
                # Добавляем новые ссылки
                to_visit.update(links - visited)
                
                logger.info(f"Scraped {len(visited)}/{max_pages} pages")
                
            except Exception as e:
                logger.error(f"Error scraping {url}: {str(e)}")
                visited.add(url)  # Помечаем как посещенную, чтобы не пытаться снова
                continue
        
        return results
