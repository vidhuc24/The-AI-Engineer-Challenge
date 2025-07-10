#!/usr/bin/env python3
"""
🐍 PyPal - Python Programming Assistant Test Script
Test suite for the RAG-powered Python documentation assistant
"""
import requests
import json
import os
from pathlib import Path

# Configuration - PyPal runs on port 8001
API_BASE_URL = "http://localhost:8001"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing PyPal health check endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def test_status():
    """Test the status endpoint"""
    print("\n🔍 Testing PyPal status endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/status")
        if response.status_code == 200:
            print("✅ Status check passed")
            status = response.json()
            print(f"   Status: {status['status']}")
            print(f"   Initialized: {status['initialized']}")
            print(f"   Python docs loaded: {status['documents_loaded']}")
            print(f"   Vector DB size: {status['vector_db_size']}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Status check error: {e}")

def test_initialization():
    """Test the initialization endpoint"""
    print("\n🔍 Testing PyPal initialization endpoint...")
    if OPENAI_API_KEY == "your-api-key-here":
        print("⚠️  Please set OPENAI_API_KEY environment variable to test initialization")
        return False
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/initialize",
            json={"api_key": OPENAI_API_KEY}
        )
        if response.status_code == 200:
            print("✅ Initialization successful")
            result = response.json()
            print(f"   Python docs loaded: {result['documents_loaded']}")
            print(f"   Chunks created: {result['chunks_created']}")
            return True
        else:
            print(f"❌ Initialization failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False

def test_chat():
    """Test the chat endpoint with Python questions"""
    print("\n🔍 Testing PyPal chat endpoint...")
    if OPENAI_API_KEY == "your-api-key-here":
        print("⚠️  Please set OPENAI_API_KEY environment variable to test chat")
        return
    
    try:
        # Test with Python-specific questions
        test_questions = [
            "What is a list in Python?",
            "How do Python decorators work?", 
            "Explain Python's for loops"
        ]
        
        for question in test_questions[:1]:  # Test first question
            print(f"\n📝 Testing question: {question}")
            response = requests.post(
                f"{API_BASE_URL}/api/chat",
                json={
                    "user_message": question,
                    "api_key": OPENAI_API_KEY,
                    "model": "gpt-4o-mini"
                }
            )
            
            if response.status_code == 200:
                print("✅ Chat endpoint working")
                print(f"   Response preview: {response.text[:150]}...")
            else:
                print(f"❌ Chat failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Chat error: {e}")

def test_search():
    """Test the search endpoint with Python topics"""
    print("\n🔍 Testing PyPal search endpoint...")
    try:
        python_search_terms = [
            "list methods",
            "string operations",
            "dictionary comprehension"
        ]
        
        for term in python_search_terms[:1]:  # Test first term
            print(f"\n🔍 Searching for: {term}")
            response = requests.get(
                f"{API_BASE_URL}/api/search",
                params={"query": term, "k": 3}
            )
            if response.status_code == 200:
                print("✅ Search endpoint working")
                results = response.json()
                print(f"   Found {results['total_found']} results for '{term}'")
                if results['results']:
                    print(f"   First result: {results['results'][0]['snippet'][:100]}...")
            else:
                print(f"❌ Search failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Search error: {e}")

def main():
    """Run all PyPal tests"""
    print("🧪 Testing PyPal - Python Programming Assistant")
    print("=" * 60)
    
    # Check if Python documentation exists
    data_dir = Path("../data")
    if not data_dir.exists():
        print("⚠️  Warning: ../data directory not found")
        print("   Make sure you've run the Python documentation collection script")
    else:
        doc_files = list(data_dir.glob("*.txt"))
        print(f"📄 Found {len(doc_files)} Python documentation files")
    
    # Run tests
    test_health_check()
    test_status()
    
    # Initialize and test functionality if API key is available
    if OPENAI_API_KEY != "your-api-key-here":
        initialized = test_initialization()
        if initialized:
            test_chat()
            test_search()
    else:
        print("\n⚠️  To test initialization, chat, and search:")
        print("   export OPENAI_API_KEY='your-openai-api-key'")
        print("   python test_api.py")
    
    print("\n🎉 PyPal API testing complete!")
    print("🚀 Ready to build the frontend!")

if __name__ == "__main__":
    main() 