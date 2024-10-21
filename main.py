from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from langchain_openai import OpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import asyncio

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

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


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    user_contexts[user_id] = {"contexts": {}, "current_document": None}
    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message")
            document_id = data.get("document_id")
            selected_text = data.get("selected_text")
            # Update current document context
            user_contexts[user_id]["current_document"] = document_id
            if document_id not in user_contexts[user_id]["contexts"]:
                user_contexts[user_id]["contexts"][document_id] = {"context": None}
            # Process the message with Langchain
            response = await process_message(user_id, message, document_id, selected_text)
            await websocket.send_json({"response": response})
    except WebSocketDisconnect:
        del user_contexts[user_id]


async def process_message(user_id, message, document_id, selected_text):
    # Retrieve the current context for the document
    context = user_contexts[user_id]["contexts"][document_id].get("context")

    # Initialize Langchain components with API key from environment variables
    llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), model=os.getenv("OPENAI_MODEL_NAME"))
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
    response = chain.invoke({
        "document_id": document_id,
        "selected_text": selected_text,
        "message": message,
        "context": context
    })

    # Update context if needed
    user_contexts[user_id]["contexts"][document_id]["context"] = response

    return response
