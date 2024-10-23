@echo off

set SCRIPT_DIR=%~dp0
setlocal enabledelayedexpansion

:check_python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    set /p INSTALL_PYTHON="Python is not installed. Do you want to install it? (Y/N): "
    if /i "!INSTALL_PYTHON!"=="Y" (
        echo Click on 'Install' for installing the latest version of Python...
        start ms-windows-store://pdp/?productid=9NCVDN91XZQP
        echo Waiting for Python installation to complete...
        timeout /t 5 /nobreak >nul 2>&1
        goto check_python_installed
    ) else (
	echo Cannot proceed without installing python
        exit /b
    )
)

:check_python_installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 5 /nobreak >nul 2>&1
    goto check_python_installed
)


:check_node
where node >nul 2>&1
if %errorlevel% neq 0 (
    set /p INSTALL_NODE="Node.js is not installed. Do you want to install it? (Y/N): "
    if /i "!INSTALL_NODE!"=="Y" (
        echo Downloading Node.js...
        powershell -command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile 'node-v20.18.0-x64.msi'"
        echo Installing Node.js...
        start /wait "" msiexec /i "node-v20.18.0-x64.msi"
        del node-v20.18.0-x64.msi
	echo Node has installed successfully
	echo Restart terminal and run './run.bat' once again
	exit /b
    ) else (
	echo Cannot proceed without installing node
        exit /b
    )
)

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

pause
