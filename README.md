# Family Expense Tracker

A comprehensive expense tracking application for families, featuring manual entry, receipt scanning, and CSV import capabilities.

## Features

- Manual expense entry with user-friendly interface
- Receipt scanning with OCR (Optical Character Recognition)
- CSV/Excel import from bank statements
- Interactive dashboards and visualizations
- Search and filter functionality
- Secure authentication system

## Tech Stack

### Backend
- Python 3.9+
- FastAPI
- SQLAlchemy (ORM)
- SQLite (development) / PostgreSQL (production)
- Tesseract OCR
- Pydantic

### Frontend
- React
- TypeScript
- Material-UI
- Chart.js
- React Query

## Project Structure

```
expense_ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── docker/
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Development Guidelines

- Follow PEP 8 style guide for Python code
- Use TypeScript for frontend development
- Write unit tests for critical functionality
- Document API endpoints using OpenAPI/Swagger
- Use conventional commits for version control

## License

MIT License