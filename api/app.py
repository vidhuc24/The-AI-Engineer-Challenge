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
import json # Added for json.dumps

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
all_document_chunks = []  # Store all document chunks for rebuilding vector DB

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]  # Full conversation history
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default
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
                search_results = vector_db.search_by_text(user_message, k=5, return_as_text=False)
                
                # Log similarity scores for debugging
                print(f"Query: {user_message}")
                print(f"Similarity scores: {[(score, text[:50] + '...') for text, score in search_results]}")
                
                # Multi-tier similarity thresholds for different confidence levels
                HIGH_CONFIDENCE_THRESHOLD = 0.85  # Very relevant content
                MEDIUM_CONFIDENCE_THRESHOLD = 0.70  # Moderately relevant content
                LOW_CONFIDENCE_THRESHOLD = 0.55   # Potentially relevant content
                
                high_confidence_contexts = []
                medium_confidence_contexts = []
                low_confidence_contexts = []
                
                for text, similarity_score in search_results:
                    if similarity_score >= HIGH_CONFIDENCE_THRESHOLD:
                        high_confidence_contexts.append((text, similarity_score))
                    elif similarity_score >= MEDIUM_CONFIDENCE_THRESHOLD:
                        medium_confidence_contexts.append((text, similarity_score))
                    elif similarity_score >= LOW_CONFIDENCE_THRESHOLD:
                        low_confidence_contexts.append((text, similarity_score))
                
                # Determine response strategy based on context quality
                if high_confidence_contexts:
                    # High confidence: Use only the best contexts
                    relevant_contexts = [text for text, score in high_confidence_contexts[:3]]
                    confidence_level = "high"
                elif medium_confidence_contexts:
                    # Medium confidence: Use medium contexts but indicate uncertainty
                    relevant_contexts = [text for text, score in medium_confidence_contexts[:2]]
                    confidence_level = "medium"
                elif low_confidence_contexts:
                    # Low confidence: Use cautious language
                    relevant_contexts = [text for text, score in low_confidence_contexts[:1]]
                    confidence_level = "low"
                else:
                    # No relevant contexts found
                    relevant_contexts = []
                    confidence_level = "none"
                
                if relevant_contexts:
                    # Build context string from relevant documents
                    context_str = "\n\n".join([f"Context {i+1}: {ctx}" for i, ctx in enumerate(relevant_contexts)])
                    
                    # Adjust prompt based on confidence level
                    if confidence_level == "high":
                        enhanced_message = f"""You are a document-only assistant. Answer the question based on the following highly relevant context from uploaded documents. You can be confident in your response.

Context from uploaded documents:
{context_str}

Question: {user_message}

Instructions: Answer based on the context above. If any part of the answer is not in the context, clearly state what information is missing."""
                    elif confidence_level == "medium":
                        enhanced_message = f"""You are a document-only assistant. Answer the question based on the following moderately relevant context from uploaded documents. Be somewhat cautious in your response.

Context from uploaded documents:
{context_str}

Question: {user_message}

Instructions: Answer based on the context above, but indicate if the information seems only partially relevant or if you're uncertain about any aspects."""
                    else:  # low confidence
                        enhanced_message = f"""You are a document-only assistant. I found some potentially relevant context from uploaded documents, but the relevance is uncertain.

Context from uploaded documents:
{context_str}

Question: {user_message}

Instructions: Based on the context above, provide what information you can, but clearly indicate that the relevance is uncertain and suggest the user rephrase their question for better results."""
                    
                    # Replace the last message with the enhanced version
                    enhanced_messages = request.messages[:-1] + [{"role": "user", "content": enhanced_message}]
                else:
                    # No relevant context found - strict "I don't know" response
                    enhanced_message = f"""I don't know - this information is not available in the uploaded documents. 

I searched through {len(all_document_chunks)} document chunks from {len(uploaded_docs)} document(s), but couldn't find relevant information to answer your question.

Please try:
- Rephrasing your question with different keywords
- Asking about specific topics mentioned in the documents
- Being more specific about what you're looking for

Available documents: {', '.join([doc['filename'] for doc in uploaded_docs])}"""
                    
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
            try:
                # Create a streaming chat completion request with full conversation history
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=enhanced_messages,  # Send the enhanced conversation history
                    stream=True  # Enable streaming response
                )
                
                # Yield each chunk of the response as it becomes available in SSE format
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        # Format as Server-Sent Events (SSE) with proper JSON structure
                        sse_data = {
                            "choices": [{
                                "delta": {
                                    "content": chunk.choices[0].delta.content
                                }
                            }]
                        }
                        yield f"data: {json.dumps(sse_data)}\n\n"
                
                # Send completion signal
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                # Handle streaming errors by sending an error message
                error_message = f"Error: {str(e)}"
                error_data = {
                    "choices": [{
                        "delta": {
                            "content": error_message
                        }
                    }]
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                yield "data: [DONE]\n\n"

        # Return a streaming response to the client with proper SSE media type
        return StreamingResponse(generate(), media_type="text/event-stream")
    
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
            global vector_db, has_documents, all_document_chunks
            
            # Add new chunks to accumulated chunks
            all_document_chunks.extend(split_docs)
            
            # Rebuild vector database with all accumulated chunks
            vector_db = VectorDatabase(
                embedding_model=EmbeddingModel(api_key=api_key)
            )
            
            # Build vector database from all document chunks
            vector_db = await vector_db.abuild_from_list(all_document_chunks)
            
            # Update global state
            has_documents = True
            
            uploaded_docs.append({
                "filename": file.filename,
                "timestamp": os.path.getmtime(temp_file_path)
            })
            
            return {"message": f"Document {file.filename} uploaded successfully. Total chunks: {len(all_document_chunks)}"}
            
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

# Debug endpoint to test similarity scores
@app.post("/api/debug/similarity")
async def debug_similarity(request: dict):
    """Debug endpoint to test similarity scores for a query."""
    if not has_documents or not vector_db:
        raise HTTPException(status_code=400, detail="No documents available")
    
    query = request.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    try:
        search_results = vector_db.search_by_text(query, k=10, return_as_text=False)
        
        return {
            "query": query,
            "total_chunks": len(all_document_chunks),
            "results": [
                {
                    "similarity_score": float(score),
                    "text_preview": text[:100] + "..." if len(text) > 100 else text,
                    "confidence_level": (
                        "high" if score >= 0.85 else
                        "medium" if score >= 0.70 else
                        "low" if score >= 0.55 else
                        "very_low"
                    )
                }
                for text, score in search_results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

# New endpoint to remove individual document
@app.delete("/api/documents/{filename}")
async def remove_document(filename: str):
    """Remove a specific document from the uploaded list."""
    global uploaded_docs
    
    # Find and remove the document
    uploaded_docs = [doc for doc in uploaded_docs if doc['filename'] != filename]
    
    return {"message": f"Document {filename} removed from list"}

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
    global has_documents, vector_db, uploaded_docs, all_document_chunks
    vector_db = None  # Reset vector database
    has_documents = False
    uploaded_docs = []  # Clear uploaded documents list
    all_document_chunks = [] # Clear accumulated chunks
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
