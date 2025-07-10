# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import asyncio
from typing import Optional, List
import json
from pathlib import Path

# Import our RAG utilities - using relative imports for self-containment
import sys
sys.path.append('..')
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import CharacterTextSplitter
from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

# Initialize FastAPI application
app = FastAPI(
    title="PyPal - Python Programming Assistant API", 
    description="RAG-powered Python documentation assistant",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for RAG system
vector_db = None
chat_model = None
embedding_model = None
is_initialized = False

# Pydantic models for request/response
class ChatRequest(BaseModel):
    user_message: str
    api_key: str
    model: Optional[str] = "gpt-4o-mini"

class InitializeRequest(BaseModel):
    api_key: str

class StatusResponse(BaseModel):
    status: str
    initialized: bool
    documents_loaded: int
    vector_db_size: int

# Initialize the RAG system
async def initialize_rag_system(api_key: str):
    """Initialize the RAG system with Python documentation"""
    global vector_db, chat_model, embedding_model, is_initialized
    
    try:
        print("🚀 Initializing PyPal RAG system...")
        
        # Initialize OpenAI components
        embedding_model = EmbeddingModel(api_key=api_key)
        chat_model = ChatOpenAI(api_key=api_key)
        vector_db = VectorDatabase(embedding_model=embedding_model)
        
        # Load Python documentation - self-contained path
        data_dir = Path("../data")  # From api/ to data/
        
        if not data_dir.exists():
            raise ValueError("Could not find Python documentation directory")
            
        documents = []
        doc_files = []
        
        # Load all text files from data directory
        for txt_file in data_dir.glob("*.txt"):
            with open(txt_file, 'r', encoding='utf-8') as f:
                content = f.read()
                documents.append(content)
                doc_files.append(txt_file.name)
        
        print(f"📚 Loaded {len(documents)} Python documentation files")
        
        # Split documents into chunks
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        all_chunks = []
        
        for i, doc in enumerate(documents):
            chunks = text_splitter.split(doc)
            # Add metadata to chunks
            for chunk in chunks:
                chunk_with_metadata = f"[From: {doc_files[i]}]\n{chunk}"
                all_chunks.append(chunk_with_metadata)
        
        print(f"🔧 Created {len(all_chunks)} chunks from documentation")
        
        # Build vector database
        print("🧠 Building vector database (this may take a moment)...")
        vector_db = await vector_db.abuild_from_list(all_chunks)
        
        is_initialized = True
        print("✅ PyPal RAG system initialized successfully!")
        
        return {
            "status": "success", 
            "documents_loaded": len(documents),
            "chunks_created": len(all_chunks)
        }
        
    except Exception as e:
        print(f"❌ Error initializing RAG system: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize RAG system: {str(e)}")

# Endpoints
@app.post("/api/initialize")
async def initialize_system(request: InitializeRequest):
    """Initialize the RAG system with the provided API key"""
    result = await initialize_rag_system(request.api_key)
    return result

@app.get("/api/status")
async def get_status():
    """Get the current status of the RAG system"""
    global vector_db, is_initialized
    
    # Check for data directory
    data_dir = Path("../data")
    documents_loaded = len(list(data_dir.glob("*.txt"))) if data_dir.exists() else 0
    
    return StatusResponse(
        status="ready" if is_initialized else "not_initialized",
        initialized=is_initialized,
        documents_loaded=documents_loaded,
        vector_db_size=len(vector_db.vectors) if vector_db else 0
    )

@app.post("/api/chat")
async def chat_with_assistant(request: ChatRequest):
    """Chat with the Python Programming Assistant using RAG"""
    global vector_db, chat_model, is_initialized
    
    if not is_initialized:
        # Try to initialize if not already done
        try:
            await initialize_rag_system(request.api_key)
        except:
            raise HTTPException(status_code=400, detail="System not initialized. Please initialize first with /api/initialize")
    
    try:
        # Search for relevant context
        relevant_docs = vector_db.search_by_text(
            request.user_message, 
            k=3,  # Get top 3 most relevant chunks
            return_as_text=True
        )
        
        # Create context from relevant documents
        context = "\n\n".join(relevant_docs)
        
        # Create the prompt for the LLM
        system_prompt = """You are PyPal, a Python Programming Assistant. You help developers with Python programming questions by providing accurate, helpful information based on the Python documentation provided.

Instructions:
1. Answer questions about Python programming using the provided context
2. Provide clear, practical code examples when helpful
3. Use proper Python syntax highlighting in your responses
4. If the context doesn't contain enough information, say "I don't have enough information in the Python documentation to answer that question accurately."
5. Keep your answers focused, practical, and beginner-friendly
6. When showing code, explain what it does step by step

Context from Python Documentation:
{context}

User Question: {question}

Answer:"""

        prompt = system_prompt.format(context=context, question=request.user_message)
        
        # Create async generator for streaming response
        async def generate_response():
            try:
                # Get streaming response from OpenAI
                client = OpenAI(api_key=request.api_key)
                
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    max_tokens=1000,
                    temperature=0.1  # Low temperature for factual responses
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
                        
            except Exception as e:
                yield f"Error: {str(e)}"
        
        return StreamingResponse(generate_response(), media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

@app.get("/api/search")
async def search_documentation(query: str, k: int = 5):
    """Search the Python documentation for relevant information"""
    global vector_db, is_initialized
    
    if not is_initialized or not vector_db:
        raise HTTPException(status_code=400, detail="System not initialized")
    
    try:
        # Search for relevant documents
        results = vector_db.search_by_text(query, k=k, return_as_text=False)
        
        # Format results
        formatted_results = []
        for text, score in results:
            formatted_results.append({
                "content": text[:500] + "..." if len(text) > 500 else text,
                "similarity_score": float(score),
                "snippet": text.split('\n')[0]  # First line as snippet
            })
        
        return {
            "query": query,
            "results": formatted_results,
            "total_found": len(formatted_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching documentation: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "PyPal - Python Programming Assistant"}

# Run the application on port 8001 (different from Docling's 8000)
if __name__ == "__main__":
    import uvicorn
    print("🐍 Starting PyPal - Python Programming Assistant")
    print("🚀 Backend API will be available at: http://localhost:8001")
    print("📖 API documentation: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001) 