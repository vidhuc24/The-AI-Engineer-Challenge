#!/usr/bin/env python3
"""
🐍 PyPal - Python Programming Assistant Startup Script
Self-contained startup for RAG-powered Python documentation assistant
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the parent directory to the path so we can import from aimakerspace
sys.path.append(str(Path(__file__).parent.parent))

if __name__ == "__main__":
    print("🐍 Starting PyPal - Python Programming Assistant...")
    print("📚 RAG-powered Python documentation assistant")
    print("🚀 Backend API will be available at: http://localhost:8001")
    print("📖 API documentation: http://localhost:8001/docs")
    print("🔗 Frontend (when built): http://localhost:3001")
    print("\n💡 Note: Make sure to initialize the system with your OpenAI API key first!")
    print("   Use POST /api/initialize with your API key")
    print("   Or visit the frontend to enter your API key\n")
    
    try:
        # Start the FastAPI server on port 8001 (PyPal's dedicated port)
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=8001,
            reload=True,  # Enable auto-reload for development
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down PyPal...")
    except Exception as e:
        print(f"❌ Error starting PyPal: {e}")
        sys.exit(1) 