# Industrial Policy Chatbot

An intelligent chatbot that answers questions about Karnataka's New Industrial Policy 2025–2030 using a **Hybrid RAG** (Retrieval-Augmented Generation) pipeline. It combines sparse keyword search, dense semantic search, and cross-encoder reranking to surface the most relevant policy excerpts, then uses a Llama 4 model hosted on Groq to generate accurate, context-grounded answers.

---

## What It Does

- Accepts natural-language questions about Karnataka's industrial policy
- Retrieves the most relevant document chunks using a hybrid BM25 + ChromaDB pipeline
- Re-ranks results with a cross-encoder model for higher precision
- Generates answers with a Llama 4 Scout LLM (via Groq)
- Maintains short-term conversation memory per browser session
- Renders responses in Markdown (headings, lists, tables, code blocks)

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Meta Llama 4 Scout 17B via [Groq](https://groq.com) |
| Agent framework | LangChain `create_agent` + LangGraph |
| Dense retrieval | ChromaDB + `BAAI/bge-base-en-v1.5` embeddings |
| Sparse retrieval | BM25 (rank-bm25) |
| Reranking | `BAAI/bge-reranker-v2-m3` cross-encoder |
| Document parsing | Docling + HybridChunker |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Animations | Framer Motion |
| Markdown | react-markdown + remark-gfm |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
hybrid_rag/
├── main.py                  # FastAPI app — /chat and /history endpoints
├── generation.py            # LangGraph agent + LLM setup
├── retriever.py             # Hybrid retriever (BM25 + ChromaDB + reranker)
├── chunking.py              # One-time PDF ingestion script
├── requirements.txt         # Python dependencies
├── bm25_retriever.pkl       # Pre-built BM25 index
├── krnatkadb/               # Persisted ChromaDB vector store
├── .env.example             # API key template
│
├── frontend/                # React + Vite SPA
│   ├── src/App.jsx          # Chat UI with session management
│   ├── vite.config.js       # Dev proxy → localhost:8000
│   └── package.json
│
├── Dockerfile               # Backend container
├── Dockerfile.frontend      # Frontend container (build + nginx)
├── nginx.conf               # nginx proxy config
├── docker-compose.yml       # Orchestrates backend + frontend
└── .dockerignore
```

---

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- A [Groq API key](https://console.groq.com)

### 1 — Clone and set up the environment

```bash
git clone <repo-url>
cd hybrid_rag

# Python virtual environment
python -m venv myvenv
myvenv\Scripts\activate          # Windows
# source myvenv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

### 2 — Add your API key

```bash
cp .env.example .env
# Edit .env and set GROQ_API_KEY=your_key_here
```

### 3 — Run the backend

```bash
python main.py
# Server starts at http://localhost:8000
```

### 4 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

---

## Running with Docker

```bash
# Set your Groq API key in the host shell
export GROQ_API_KEY=your_key_here   # macOS / Linux
set GROQ_API_KEY=your_key_here      # Windows CMD

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (nginx) | http://localhost |
| Backend (FastAPI) | http://localhost:8000 |

> **First run:** HuggingFace downloads `BAAI/bge-base-en-v1.5` (~400 MB) and `BAAI/bge-reranker-v2-m3` (~1.1 GB). These are cached in a Docker named volume and reused on subsequent starts.

---

## API Reference

### `POST /chat`

Send a message and receive the full conversation history.

**Request**
```json
{ "question": "What are the key sectors targeted?", "session_id": "abc123" }
```

**Response**
```json
{
  "history": [
    { "role": "human", "content": "What are the key sectors targeted?" },
    { "role": "ai",    "content": "The policy targets..." }
  ]
}
```

### `DELETE /history/{session_id}`

Clears the conversation memory for the given session by rotating its internal LangGraph thread ID.

---

## How It Works

See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for a full technical walkthrough with architecture and flow diagrams.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |
