# Setup script for Family Expense Tracker
Write-Host "Setting up Family Expense Tracker..." -ForegroundColor Green

# Function to download and install Tesseract
function Install-Tesseract {
    Write-Host "Downloading Tesseract installer..." -ForegroundColor Yellow
    $installerUrl = "https://github.com/UB-Mannheim/tesseract/wiki/files/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
    $installerPath = "$env:TEMP\tesseract-installer.exe"
    
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
        Write-Host "Installing Tesseract..." -ForegroundColor Yellow
        Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait
        Write-Host "Tesseract installed successfully!" -ForegroundColor Green
        
        # Add Tesseract to PATH if not already there
        $tesseractPath = "C:\Program Files\Tesseract-OCR"
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        if ($currentPath -notlike "*$tesseractPath*") {
            [Environment]::SetEnvironmentVariable("Path", $currentPath + ";$tesseractPath", "Machine")
            Write-Host "Added Tesseract to system PATH" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Failed to install Tesseract: $_" -ForegroundColor Red
        Write-Host "Please install Tesseract manually from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
        exit 1
    }
    finally {
        if (Test-Path $installerPath) {
            Remove-Item $installerPath
        }
    }
}

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python is not installed. Please install Python 3.9 or later from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host "Python version: $pythonVersion" -ForegroundColor Green

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Setup Backend
Write-Host "Setting up backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
Write-Host "Installing/Updating backend dependencies..." -ForegroundColor Yellow
& backend\venv\Scripts\activate
pip install --upgrade pip
pip install -r backend\requirements.txt

# Setup Frontend
Write-Host "Setting up frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "Frontend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
if (-not (Test-Path "backend\uploads")) {
    New-Item -ItemType Directory -Path "backend\uploads"
    Write-Host "Created uploads directory" -ForegroundColor Green
} else {
    Write-Host "Uploads directory already exists" -ForegroundColor Green
}

# Check Tesseract installation
Write-Host "Checking Tesseract installation..." -ForegroundColor Yellow
$tesseractVersion = tesseract --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tesseract is not installed. Installing now..." -ForegroundColor Yellow
    Install-Tesseract
} else {
    Write-Host "Tesseract version: $tesseractVersion" -ForegroundColor Green
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "`nTo start the application:" -ForegroundColor Yellow
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend"
Write-Host "   .\venv\Scripts\activate"
Write-Host "   uvicorn app.main:app --reload --port 8000"
Write-Host "`n2. In a new terminal, start the frontend server:" -ForegroundColor White
Write-Host "   cd frontend"
Write-Host "   npm start"
Write-Host "`nThe application will be available at:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor White 