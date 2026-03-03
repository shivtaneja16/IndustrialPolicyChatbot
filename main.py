import uuid
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from generation import agent, get_configurable, checkpointer

app = FastAPI(title="Karnataka Industrial Policy Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maps frontend session_id -> internal LangGraph thread_id.
# Reassigning the thread_id is how we "clear" memory without touching
# InMemorySaver internals.
session_threads: dict[str, str] = {}


def _get_thread_id(session_id: str) -> str:
    if session_id not in session_threads:
        session_threads[session_id] = session_id
    return session_threads[session_id]


def _extract_history(messages: list) -> list[dict]:
    """Return only human / final-AI messages suitable for the frontend."""
    history = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            history.append({"role": "human", "content": msg.content})
        elif isinstance(msg, AIMessage) and msg.content:
            # Skip intermediate AIMessages that only contain tool-call payloads
            history.append({"role": "ai", "content": msg.content})
    return history


# --------------------------------------------------------------------------- #
# Request / Response schemas
# --------------------------------------------------------------------------- #

class ChatRequest(BaseModel):
    question: str
    session_id: str


class ChatResponse(BaseModel):
    history: list[dict]


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message and receive the full updated conversation history."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    thread_id = _get_thread_id(req.session_id)
    config = get_configurable(thread_id)

    try:
        response = await agent.ainvoke(
            {"messages": [{"role": "human", "content": req.question}]},
            config=config,
        )
    except Exception as exc:
        traceback.print_exc()          # full traceback in the server terminal
        detail = f"{type(exc).__name__}: {exc}" if str(exc) else type(exc).__name__
        raise HTTPException(status_code=500, detail=detail)

    return ChatResponse(history=_extract_history(response["messages"]))


@app.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear short-term memory for a session by rotating its thread_id."""
    new_thread_id = str(uuid.uuid4())
    session_threads[session_id] = new_thread_id
    return {"status": "cleared", "session_id": session_id}


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
