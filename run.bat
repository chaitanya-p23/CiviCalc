@echo off

REM Check if the .env file exists, if not, prompt for API key and save it in the correct format
if not exist flask-server\.env (
    set /p API_KEY="Enter your API key: "
    
    REM Use echo with delayed expansion to ensure the key is saved
    setlocal enabledelayedexpansion
    echo LANGCHAIN_API_KEY=!API_KEY! > flask-server\.env
    echo .env file created with API key: LANGCHAIN_API_KEY=!API_KEY!
    endlocal
) else (
    echo .env file already exists. Skipping API key input.
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing virtual environment package...
    pip install --user virtualenv
)

if not exist "flask-server\venv" (
    echo Creating virtual environment...
    python -m venv flask-server\venv
)

call flask-server\venv\Scripts\activate

echo Installing required packages for Flask...
pip install ./flask-server

REM Start Flask Server
echo Starting Flask server...
start "" cmd /c "cd flask-server && python app.py"

REM Start React App
echo Starting React app...
start "" cmd /k "cd react-app && npm install && npm install lucide-react && npm start"

REM Optional: wait for all processes to finish (if needed)
REM timeout /t 10

pause