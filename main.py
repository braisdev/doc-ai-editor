import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import socketio
from pydantic import BaseModel
from langchain_openai import OpenAI
from langchain_core.prompts import PromptTemplate

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update if frontend is hosted elsewhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO server with ASGI mode and CORS settings
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000"],  # Ensure this matches your frontend URL
)
app.mount("/socket.io", socketio.ASGIApp(sio))

# Placeholder for user contexts
user_contexts = {}


class Message(BaseModel):
    user_id: str
    message: str
    document_id: str
    selected_text: str = None


@app.get("/")
def read_root():
    return {"message": "Welcome to Doc AI Editor!"}


@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")


@sio.event
async def message(sid, data):
    user_id = data.get("user_id")
    message = data.get("message")
    document_id = data.get("document_id")
    selected_text = data.get("selected_text")

    # Initialize user context if not present
    if user_id not in user_contexts:
        user_contexts[user_id] = {}
    if document_id not in user_contexts[user_id]:
        user_contexts[user_id][document_id] = {"context": None}

    # Update current document context
    user_contexts[user_id]["current_document"] = document_id

    # Retrieve the current context for the document
    context = user_contexts[user_id][document_id].get("context")

    # Initialize Langchain components with API key from environment variables
    llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    template = """
    You are an assistant that helps with document editing.
    Document ID: {document_id}
    Selected Text: {selected_text}
    User Message: {message}
    Context: {context}
    """
    prompt = PromptTemplate(
        input_variables=["document_id", "selected_text", "message", "context"],
        template=template
    )
    chain = prompt | llm

    # Generate response
    response = await asyncio.to_thread(chain.invoke, {
        "document_id": document_id,
        "selected_text": selected_text,
        "message": message,
        "context": context
    })

    # Update context if needed
    user_contexts[user_id][document_id]["context"] = response

    # Send response back to the client
    await sio.emit('response', {"response": response}, to=sid)
