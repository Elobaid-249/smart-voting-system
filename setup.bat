@echo off
echo ========================================
echo    Smart Voting System Setup
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

echo Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment created
echo.

echo Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment activated
echo.

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.
echo ========================================
echo    Setup Completed Successfully!
echo ========================================
echo.
echo To run the application:
echo   1. venv\Scripts\activate
echo   2. python app.py
echo.
echo Then open: http://localhost:5000
echo.
echo Test Accounts:
echo   Admin: admin@smartvote.com / admin123
echo   Voter: voter1@example.com / password123
echo.
pause