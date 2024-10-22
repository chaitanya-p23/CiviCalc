#!/bin/bash

if [ ! -f flask-server/.env ]; then
    read -p "Enter your API key: " API_KEY
    echo "LANGCHAIN_API_KEY=${API_KEY}" > flask-server/.env
    echo ".env file created with API key."
else
    echo ".env file already exists. Skipping API key input."
fi

if ! python -m venv --help &>/dev/null; then
    echo "Installing virtual environment package..."
    pip install --user virtualenv
fi

if [ ! -d "flask-server/venv" ]; then
    echo "Creating virtual environment..."
    python -m venv flask-server/venv
fi

source flask-server/venv/bin/activate

echo "Installing required packages..."
pip install ./flask-server

cleanup() {
    echo -e "\nStopping Flask server and React app..."
    kill $FLASK_PID
    kill $REACT_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Thread 1: Flask Server
cd flask-server
python app.py &
FLASK_PID=$!

# Thread 2: React App
cd ../react-app
npm install
npm install lucide-react
npm start &
REACT_PID=$!

wait $FLASK_PID $REACT_PID

