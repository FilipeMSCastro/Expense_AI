import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime
from ..schemas.schemas import ExpenseCreate

class CSVService:
    def process_csv(self, file_path: str) -> List[ExpenseCreate]:
        """
        Process a CSV file and extract expense information
        """
        try:
            # Read the CSV file
            df = pd.read_csv(file_path)
            
            # Standardize column names
            df.columns = [col.lower().strip() for col in df.columns]
            
            # Map common bank statement columns to our schema
            column_mapping = {
                'date': ['date', 'transaction_date', 'posted_date'],
                'amount': ['amount', 'debit', 'transaction_amount'],
                'description': ['description', 'memo', 'payee', 'merchant']
            }
            
            # Find matching columns
            mapped_columns = {}
            for target, possible_names in column_mapping.items():
                for name in possible_names:
                    if name in df.columns:
                        mapped_columns[target] = name
                        break
            
            if not mapped_columns:
                raise ValueError("No matching columns found in CSV file")
            
            # Convert date strings to datetime
            df[mapped_columns['date']] = pd.to_datetime(df[mapped_columns['date']])
            
            # Create ExpenseCreate objects
            expenses = []
            for _, row in df.iterrows():
                # Handle negative amounts (debits)
                amount = abs(float(row[mapped_columns['amount']]))
                
                expense = ExpenseCreate(
                    amount=amount,
                    description=str(row[mapped_columns['description']]),
                    date=row[mapped_columns['date']],
                    category_id=1  # Default category, should be updated by user
                )
                expenses.append(expense)
            
            return expenses
            
        except Exception as e:
            raise Exception(f"Error processing CSV file: {str(e)}")
    
    def validate_csv(self, file_path: str) -> bool:
        """
        Validate if the CSV file has the required structure
        """
        try:
            df = pd.read_csv(file_path)
            required_columns = ['date', 'amount', 'description']
            
            # Check if any of the required columns exist
            df.columns = [col.lower().strip() for col in df.columns]
            has_required = any(col in df.columns for col in required_columns)
            
            return has_required
            
        except Exception:
            return False 