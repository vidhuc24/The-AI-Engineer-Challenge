# 🐍 PyPal - Python Programming Assistant

A RAG-powered Python programming assistant that helps developers with Python questions using comprehensive Python documentation.

## 🚀 Features

- **Python Documentation RAG**: Pre-loaded with 41 comprehensive Python documentation files
- **Real-time Chat**: Streaming responses with syntax highlighting
- **Code Examples**: Contextual Python code examples and explanations
- **Documentation Search**: Semantic search through Python docs
- **Clean UI**: Modern, developer-friendly interface

## 🏗️ Architecture

```
python-programming-assistant/
├── api/                    # FastAPI Backend (Port 8001)
│   ├── app.py             # Main FastAPI application
│   ├── start_api.py       # Startup script
│   ├── test_api.py        # API testing script
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js Frontend (Port 3001)
│   ├── app/               # Next.js app directory
│   ├── package.json       # Node.js dependencies
│   └── ...                # React components
├── data/                  # Python Documentation (41 files)
│   ├── python_builtin_functions.txt
│   ├── python_data_structures.txt
│   └── ...                # More Python docs
├── aimakerspace/          # RAG Utilities (Self-contained)
│   ├── vectordatabase.py  # Vector database implementation
│   ├── text_utils.py      # Text processing utilities
│   └── openai_utils/      # OpenAI integration
└── collect_python_docs.py # Documentation collection script
```

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API Key

### Quick Start

1. **Backend Setup**
   ```bash
   cd api
   pip install -r requirements.txt
   python start_api.py
   ```
   Backend runs on: http://localhost:8001

2. **Frontend Setup** (In new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on: http://localhost:3001

3. **Initialize with OpenAI API Key**
   - Visit http://localhost:3001
   - Enter your OpenAI API key
   - Start asking Python questions!

## 📊 API Endpoints

- `GET /api/health` - Health check
- `GET /api/status` - System status and document count
- `POST /api/initialize` - Initialize RAG system with API key
- `POST /api/chat` - Chat with Python assistant
- `GET /api/search` - Search Python documentation

## 🎯 Usage Examples

**Sample Questions:**
- "How do I create a list in Python?"
- "What are Python decorators and how do I use them?"
- "Explain Python's data model and magic methods"
- "How does exception handling work in Python?"

## 🧪 Testing

```bash
cd api
python test_api.py
```

## 🔧 Configuration

- **Ports**: Backend (8001), Frontend (3001)
- **Documentation**: 41 pre-loaded Python doc files
- **Model**: Uses gpt-4o-mini by default
- **Vector Database**: In-memory with embeddings

## 📝 Development Notes

- **Self-contained**: All dependencies included in this directory
- **No external data**: Python docs are pre-collected and included
- **Modular**: Easy to extract to standalone repository
- **Testing**: Comprehensive test suite included

## 🚀 Deployment

Ready for deployment on:
- Vercel (recommended)
- Docker
- Any cloud platform supporting Python + Node.js

## 🛡️ License

MIT License - Feel free to use for learning and development!

---

*Built with FastAPI, Next.js, and OpenAI GPT models* 