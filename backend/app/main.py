from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from datetime import timedelta
import jwt
from jose import JWTError

from .core.config import settings
from .core.security import create_access_token, verify_password, get_password_hash
from .database import get_db, engine
from . import models
from . import schemas
from .services.ocr_service import OCRService
from .services.csv_service import CSVService

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/token")

# Services
ocr_service = OCRService()
csv_service = CSVService()

# Dependency
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post(f"{settings.API_V1_STR}/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post(f"{settings.API_V1_STR}/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/v1/users/me", response_model=schemas.User)
async def get_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

# Expense endpoints
@app.post(f"{settings.API_V1_STR}/expenses/", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_expense = models.Expense(**expense.dict(), user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get(f"{settings.API_V1_STR}/expenses/", response_model=List[schemas.Expense])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return expenses

# Receipt processing endpoint
@app.post(f"{settings.API_V1_STR}/receipts/process")
async def process_receipt(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Process receipt with OCR
        receipt_data = ocr_service.process_receipt(file_path)
        
        # Create expense from receipt data
        if receipt_data["amount"] and receipt_data["date"]:
            expense = models.Expense(
                amount=receipt_data["amount"],
                description=receipt_data["store_name"] or "Receipt",
                date=receipt_data["date"],
                user_id=current_user.id,
                receipt_image_path=file_path,
                category_id=1  # Default category
            )
            db.add(expense)
            db.commit()
            db.refresh(expense)
            return expense
        else:
            raise HTTPException(
                status_code=400,
                detail="Could not extract required information from receipt"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CSV import endpoint
@app.post(f"{settings.API_V1_STR}/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Validate CSV structure
        if not csv_service.validate_csv(file_path):
            raise HTTPException(
                status_code=400,
                detail="Invalid CSV structure"
            )
        
        # Process CSV and create expenses
        expenses = csv_service.process_csv(file_path)
        created_expenses = []
        
        for expense in expenses:
            db_expense = models.Expense(
                **expense.dict(),
                user_id=current_user.id
            )
            db.add(db_expense)
            created_expenses.append(db_expense)
        
        db.commit()
        for expense in created_expenses:
            db.refresh(expense)
        
        return created_expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/categories/", response_model=list[schemas.Category])
async def get_categories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(models.Category).filter(models.Category.user_id == current_user.id).all()
    return categories

@app.post("/api/v1/categories/", response_model=schemas.Category)
async def create_category(
    category: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_category = models.Category(**category.model_dump(), user_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.put("/api/v1/categories/{category_id}", response_model=schemas.Category)
async def update_category(
    category_id: int,
    category: schemas.CategoryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category.model_dump().items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/api/v1/categories/{category_id}")
async def delete_category(
    category_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"} 