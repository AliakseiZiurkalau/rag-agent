"""XWiki connector for fetching documents"""
import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class XWikiConnector:
    """Connector for XWiki REST API"""
    
    def __init__(self, base_url: str, username: str = None, password: str = None):
        """
        Initialize XWiki connector
        
        Args:
            base_url: XWiki base URL (e.g., http://localhost:8080/xwiki)
            username: XWiki username (optional)
            password: XWiki password (optional)
        """
        self.base_url = base_url.rstrip('/')
        self.rest_url = f"{self.base_url}/rest"
        self.auth = (username, password) if username and password else None
        self.session = requests.Session()
        if self.auth:
            self.session.auth = self.auth
    
    def test_connection(self) -> bool:
        """Test connection to XWiki"""
        try:
            response = self.session.get(f"{self.rest_url}/wikis", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"XWiki connection test failed: {e}")
            return False
    
    def get_spaces(self, wiki: str = "xwiki") -> List[str]:
        """
        Get list of spaces in wiki
        
        Args:
            wiki: Wiki name (default: xwiki)
        
        Returns:
            List of space names
        """
        try:
            url = f"{self.rest_url}/wikis/{wiki}/spaces"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            spaces = []
            
            if 'spaces' in data:
                for space in data['spaces']:
                    if 'name' in space:
                        spaces.append(space['name'])
            
            return spaces
        except Exception as e:
            logger.error(f"Error getting spaces: {e}")
            return []
    
    def get_pages(self, wiki: str = "xwiki", space: str = None) -> List[Dict]:
        """
        Get list of pages
        
        Args:
            wiki: Wiki name (default: xwiki)
            space: Space name (optional, if None returns all pages)
        
        Returns:
            List of page info dictionaries
        """
        try:
            if space:
                url = f"{self.rest_url}/wikis/{wiki}/spaces/{space}/pages"
            else:
                url = f"{self.rest_url}/wikis/{wiki}/pages"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            pages = []
            
            if 'pageSummaries' in data:
                for page in data['pageSummaries']:
                    pages.append({
                        'id': page.get('id'),
                        'title': page.get('title'),
                        'space': page.get('space'),
                        'name': page.get('name'),
                        'url': page.get('xwikiRelativeUrl')
                    })
            
            return pages
        except Exception as e:
            logger.error(f"Error getting pages: {e}")
            return []
    
    def get_page_content(self, wiki: str, space: str, page_name: str) -> Optional[str]:
        """
        Get page content as plain text
        
        Args:
            wiki: Wiki name
            space: Space name
            page_name: Page name
        
        Returns:
            Page content as text or None if error
        """
        try:
            url = f"{self.rest_url}/wikis/{wiki}/spaces/{space}/pages/{page_name}"
            
            # Получаем HTML контент
            response = self.session.get(url, headers={'Accept': 'text/plain'}, timeout=10)
            response.raise_for_status()
            
            return response.text
        except Exception as e:
            logger.error(f"Error getting page content: {e}")
            return None
    
    def search_pages(self, query: str, wiki: str = "xwiki") -> List[Dict]:
        """
        Search pages by query
        
        Args:
            query: Search query
            wiki: Wiki name (default: xwiki)
        
        Returns:
            List of matching pages
        """
        try:
            url = f"{self.rest_url}/wikis/{wiki}/search"
            params = {'q': query}
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            if 'searchResults' in data:
                for result in data['searchResults']:
                    results.append({
                        'title': result.get('title'),
                        'space': result.get('space'),
                        'pageName': result.get('pageName'),
                        'score': result.get('score')
                    })
            
            return results
        except Exception as e:
            logger.error(f"Error searching pages: {e}")
            return []
    
    def fetch_all_pages_content(self, wiki: str = "xwiki", space: str = None) -> List[Dict]:
        """
        Fetch content of all pages
        
        Args:
            wiki: Wiki name
            space: Space name (optional)
        
        Returns:
            List of dictionaries with page info and content
        """
        pages = self.get_pages(wiki, space)
        results = []
        
        for page in pages:
            content = self.get_page_content(wiki, page['space'], page['name'])
            if content:
                results.append({
                    'title': page['title'],
                    'space': page['space'],
                    'name': page['name'],
                    'content': content,
                    'url': page.get('url', '')
                })
        
        return results
