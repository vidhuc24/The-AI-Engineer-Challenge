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
            # Check if this is a meta-query about the system/documents
            meta_query_keywords = [
                "what documents", "which documents", "what files", "which files",
                "what do you have", "what's in your context", "what context",
                "available documents", "uploaded documents", "document list"
            ]
            
            is_meta_query = any(keyword in user_message.lower() for keyword in meta_query_keywords)
            
            if is_meta_query:
                # For meta-queries, provide system information
                doc_info = f"I have access to {len(uploaded_docs)} uploaded document(s):\n"
                for i, doc in enumerate(uploaded_docs, 1):
                    doc_info += f"- {doc['filename']}\n"
                doc_info += f"\nTotal document chunks in vector database: {len(vector_db.vectors)}"
                
                enhanced_message = f"""I am a document-only assistant with access to the following documents:

{doc_info}

You asked: {user_message}

I can only answer questions based on the content of these uploaded documents. Please ask me specific questions about the information contained in these files."""
                
                # Replace the last message with the enhanced version
                enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
            else:
                # For regular queries, search for relevant context with similarity threshold
                search_results = vector_db.search_by_text(user_message, k=3, return_as_text=False)
                
                # Set similarity threshold - only use results above this threshold
                SIMILARITY_THRESHOLD = 0.7
                relevant_contexts = []
                
                for text, similarity_score in search_results:
                    if similarity_score >= SIMILARITY_THRESHOLD:
                        relevant_contexts.append(text)
                
                if relevant_contexts:
                    # Build context string from relevant documents
                    context_str = "\n\n".join([f"Context {i+1}: {ctx}" for i, ctx in enumerate(relevant_contexts)])
                    
                    # Strict document-only prompt
                    enhanced_message = f"""You are a document-only assistant. You can ONLY answer questions based on the following context from uploaded documents. If the information is not in the context below, you MUST respond with "I don't know - this information is not available in the uploaded documents. Please ask about topics covered in the documents."

Context from uploaded documents:
{context_str}

Question: {user_message}

Instructions: Answer ONLY based on the context above. If the answer is not in the context, respond with "I don't know - this information is not available in the uploaded documents."""
                    
                    # Replace the last message with the enhanced version
                    enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
                else:
                    # No relevant context found - strict "I don't know" response
                    enhanced_message = f"""I don't know - this information is not available in the uploaded documents. 

I can only answer questions based on the content of the {len(uploaded_docs)} document(s) you've uploaded. Please try rephrasing your question to focus on topics covered in these documents, or ask about specific sections, concepts, or details mentioned in the files."""
                    
                    enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
        else:
            # No RAG requested or no documents available
            if not has_documents:
                enhanced_message = f"""I am a document-only assistant, but no documents have been uploaded yet. 

Please upload some PDF documents first, then I'll be able to answer questions about their content."""
                enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
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
            
            # Build vector database from documents
            vector_db = await vector_db.abuild_from_list(split_docs)
            
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
        "document_count": len(vector_db.vectors) if has_documents and vector_db else 0,
        "uploaded_documents": uploaded_docs
    }

# New endpoint to get list of uploaded documents
@app.get("/api/documents/list")
async def get_uploaded_documents():
    return {
        "documents": uploaded_docs,
        "total": len(uploaded_docs)
    }

# New endpoint to clear documents
@app.post("/api/documents/clear")
async def clear_documents():
    global has_documents, vector_db, uploaded_docs
    vector_db = None  # Reset vector database
    has_documents = False
    uploaded_docs = []  # Clear uploaded documents list
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
