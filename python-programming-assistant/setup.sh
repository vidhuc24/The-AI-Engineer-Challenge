#!/bin/bash

# 🐍 PyPal - Python Programming Assistant Setup Script
# Self-contained setup for easy development and testing

echo "🐍 Setting up PyPal - Python Programming Assistant"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "collect_python_docs.py" ]; then
    echo "❌ Please run this script from the python-programming-assistant directory"
    exit 1
fi

# Check Python documentation
echo "📚 Checking Python documentation..."
if [ ! -d "data" ] || [ -z "$(ls -A data/*.txt 2>/dev/null)" ]; then
    echo "⚠️  Python documentation not found. Collecting documentation..."
    python3 collect_python_docs.py
else
    doc_count=$(ls data/*.txt 2>/dev/null | wc -l)
    echo "✅ Found $doc_count Python documentation files"
fi

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd api
pip3 install -r requirements.txt
cd ..

# Check if frontend exists and install dependencies
if [ -d "frontend" ]; then
    echo "🎨 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "⚠️  Frontend not yet built. Backend will be available on port 8001."
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start PyPal:"
echo "   Backend:  cd api && python3 start_api.py"
echo "   Frontend: cd frontend && npm run dev  (when built)"
echo ""
echo "🧪 To test PyPal:"
echo "   cd api && python3 test_api.py"
echo ""
echo "🔗 URLs:"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo "   Frontend: http://localhost:3001 (when built)" 