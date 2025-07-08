# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import tempfile
import asyncio
from typing import Optional, List, Dict, Any

# Import RAG utilities
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="ChillGPT with RAG")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Global vector database instance - Initialize without embedding model to avoid API key requirement
vector_db = None
has_documents = False
uploaded_docs = []  # Track uploaded documents

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]  # Full conversation history
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    use_rag: Optional[bool] = False  # Whether to use RAG enhancement

# Helper function to initialize vector database with API key
def initialize_vector_db():
    global vector_db
    if vector_db is None:
        vector_db = VectorDatabase()
    return vector_db

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Get the user's latest message
        user_message = request.messages[-1]["content"] if request.messages else ""
        
        # If RAG is requested and we have documents, enhance the query
        if request.use_rag and has_documents and user_message and vector_db is not None:
            # Search for relevant context
            relevant_contexts = vector_db.search_by_text(user_message, k=3, return_as_text=True)
            
            if relevant_contexts:
                # Build context string
                context_str = "\n\n".join([f"Context {i+1}: {ctx}" for i, ctx in enumerate(relevant_contexts)])
                
                # Enhance the user message with context
                enhanced_message = f"""Based on the following context from uploaded documents:

{context_str}

Please answer this question: {user_message}

If the context doesn't contain relevant information for the question, please say so and answer based on your general knowledge."""
                
                # Replace the last message with the enhanced version
                enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
            else:
                enhanced_messages = request.messages
        else:
            enhanced_messages = request.messages
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request with full conversation history
            stream = client.chat.completions.create(
                model=request.model,
                messages=enhanced_messages,  # Send the enhanced conversation history
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for document upload
@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    api_key: str = Form(...)
):
    """Upload a document to the vector database."""
    try:
        # Validate inputs
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        # Read the uploaded file
        content = await file.read()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load PDF
            loader = PDFLoader(temp_file_path)
            documents = loader.load_documents()
            
            # Split text
            text_splitter = CharacterTextSplitter()
            split_docs = text_splitter.split_texts(documents)
            
            # Initialize vector database with API key
            global vector_db, has_documents
            vector_db = VectorDatabase(
                embedding_model=EmbeddingModel(api_key=api_key)
            )
            
            # Add documents to vector database
            vector_db.add_documents(split_docs)
            
            # Update global state
            has_documents = True
            
            uploaded_docs.append({
                "filename": file.filename,
                "timestamp": os.path.getmtime(temp_file_path)
            })
            
            return {"message": f"Document {file.filename} uploaded successfully"}
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        print(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

# New endpoint to check document status
@app.get("/api/documents/status")
async def get_document_status():
    return {
        "has_documents": has_documents,
        "document_count": len(vector_db.vectors) if has_documents and vector_db else 0
    }

# New endpoint to clear documents
@app.post("/api/documents/clear")
async def clear_documents():
    global has_documents, vector_db
    vector_db = None  # Reset vector database
    has_documents = False
    return {"message": "Documents cleared successfully"}

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "rag_enabled": True}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
