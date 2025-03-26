# Start script for Family Expense Tracker
Write-Host "Starting Family Expense Tracker..." -ForegroundColor Green

# Function to check if a port is in use
function Test-PortInUse {
    param($port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("127.0.0.1", $port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
if (Test-PortInUse 8000) {
    Write-Host "Port 8000 is already in use. Please make sure no other application is using this port." -ForegroundColor Red
    exit 1
}

if (Test-PortInUse 3000) {
    Write-Host "Port 3000 is already in use. Please make sure no other application is using this port." -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

# Wait a moment for the backend to start
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "`nApplication is starting up..." -ForegroundColor Green
Write-Host "`nThe application will be available at:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C in each terminal window to stop the servers" -ForegroundColor Yellow 