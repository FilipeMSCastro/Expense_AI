import pytesseract
from PIL import Image
import re
from datetime import datetime
from typing import Dict, Optional
from ..core.config import settings

class OCRService:
    def __init__(self):
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    def process_receipt(self, image_path: str) -> Dict:
        """
        Process a receipt image and extract relevant information
        """
        try:
            # Open and preprocess the image
            image = Image.open(image_path)
            
            # Extract text from the image
            text = pytesseract.image_to_string(image)
            
            # Extract date
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            date_match = re.search(date_pattern, text)
            date_str = date_match.group(0) if date_match else None
            
            # Extract total amount
            amount_pattern = r'TOTAL[\s:]*\$?\s*(\d+\.\d{2})'
            amount_match = re.search(amount_pattern, text, re.IGNORECASE)
            amount = float(amount_match.group(1)) if amount_match else None
            
            # Extract store name (usually at the top of the receipt)
            store_name = text.split('\n')[0].strip() if text else None
            
            return {
                "date": self._parse_date(date_str) if date_str else None,
                "amount": amount,
                "store_name": store_name,
                "raw_text": text
            }
            
        except Exception as e:
            raise Exception(f"Error processing receipt: {str(e)}")
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """
        Parse date string into datetime object
        """
        try:
            # Try different date formats
            formats = ['%m/%d/%Y', '%m/%d/%y', '%d/%m/%Y', '%d/%m/%y']
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            return None
        except Exception:
            return None 