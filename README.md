# Simhas 

A persistent, source-aware Retrieval Augmented Generation (RAG) chatbot.
Upload PDF documents and ask questions about them using semantic search and a local LLM.

## Project Structure

```
simhas/
│
├── app/
│   ├── main.py                  # FastAPI app entry point + CORS + startup
│   ├── api/
│   │   ├── routes.py            # HTTP endpoints (/upload, /query)
│   │   └── schemas.py           # Pydantic request/response models
│   ├── core/
│   │   ├── config.py            # All constants (paths, models, chunk params)
│   │   └── startup.py           # Loads persisted data on server boot
│   ├── services/
│   │   ├── pdf_service.py       # PDF text extraction + page-aware chunking
│   │   ├── embedding_service.py # Sentence-transformers wrapper
│   │   ├── retrieval_service.py # Embeds query + searches vector store
│   │   └── llm_service.py       # Ollama local LLM integration
│   ├── db/
│   │   └── vector_store.py      # FAISS index + chunk storage + save/load
│   └── utils/
│       └── chunking.py          # Word-level text chunking with page tracking
│
├── data/                        # Auto-created on first run
│   ├── faiss.index              # Persisted FAISS vector index
│   └── chunks.pkl               # Persisted chunk metadata list
│
├── frontend/
│   ├── index.html               # App entry point (Vite root)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── index.js
│       ├── App.jsx
│       ├── api.js               # All fetch calls to backend
│       └── components/
│           ├── Upload.jsx       # PDF upload UI
│           ├── Chat.jsx         # Chat interface
│           └── Message.jsx      # Message bubble + source display
│
├── requirements.txt
├── .gitignore
└── README.md
```

## Features

- **PDF Upload** — Extract and chunk text from any text-based PDF
- **Semantic Search** — FAISS vector store with sentence-transformers embeddings
- **Source-Aware Answers** — Every answer shows which file and page it came from
- **Persistent Storage** — Vector index and chunks survive server restarts
- **Offline LLM** — Runs entirely locally via Ollama (no API keys needed)
- **React Frontend** — Clean chat UI built with Vite + React

## Prerequisites

- Python 3.9+
- Node.js 18+
- [Ollama](https://ollama.ai) installed locally

## Installation

### 1. Clone and set up Python environment

```bash
cd simhas
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install CPU-only dependencies

```bash
# Install CPU-only PyTorch first (prevents GPU packages downloading)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install the rest
pip install -r requirements.txt
```

### 3. Set up Ollama

```bash
# Pull the model
ollama pull tinyllama

# Start Ollama (keep running in a separate terminal)
ollama serve
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the App

You need two terminals running simultaneously.

**Terminal 1 — Backend:**
```bash
cd simhas
source venv/bin/activate
uvicorn app.main:app --reload
```
Backend runs at: `http://127.0.0.1:8000`
API docs at: `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend:**
```bash
cd simhas/frontend
npm start
```
Frontend runs at: `http://localhost:5173`

## API Reference

### POST /upload
Upload a PDF file.

**Request:** `multipart/form-data` with field `file`

**Response:**
```json
{
  "status": "ok",
  "chunks_stored": 47
}
```

### POST /query
Ask a question about uploaded documents.

**Request:**
```json
{ "question": "What are the key findings?" }
```

**Response:**
```json
{
  "answer": "The key findings are...",
  "sources": [
    { "text": "...chunk...", "source": "report.pdf", "page": 3 },
    { "text": "...chunk...", "source": "report.pdf", "page": 5 }
  ]
}
```

## Configuration

All settings are in `app/core/config.py`:

| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `OLLAMA_MODEL` | `tinyllama` | Ollama model name |
| `TOP_K` | `3` | Number of chunks retrieved per query |
| `CHUNK_SIZE` | `150` | Words per chunk |
| `CHUNK_OVERLAP` | `50` | Overlapping words between chunks |

To change the LLM model:
```bash
ollama pull mistral   # pull new model
# then update OLLAMA_MODEL = "mistral" in config.py
```

## How Persistence Works

On every `/upload`:
- `data/faiss.index` — FAISS index written to disk
- `data/chunks.pkl` — Chunk metadata (text, source, page) pickled to disk

On server startup:
- Both files are loaded automatically
- If files don't exist, server starts with an empty store (no errors)

## Error Reference

| Error | Cause | Fix |
|---|---|---|
| `Only PDF files are accepted` | Wrong file type | Upload a `.pdf` file |
| `No text found in the uploaded PDF` | Scanned/image PDF | Use an OCR tool first |
| `No documents uploaded yet` | Query before upload | Upload a PDF first |
| `Connection refused` (Ollama) | Ollama not running | Run `ollama serve` |
| `nvidia_cublas downloading` | Wrong torch build | Install CPU torch first (see step 2) |

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| PDF Processing | PyMuPDF (fitz) |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| Vector Store | FAISS (CPU) |
| LLM | Ollama (`tinyllama`) |
| Frontend | React 18 + Vite 7 |

## License

Copyright (c) 2026 Romin Kevadiya. All rights reserved.

This software and its source code are the exclusive property of Romin Kevadiya.

Permission is granted to view this code for personal reference and educational
purposes only.

You are strictly prohibited from:
- Copying, reproducing, or redistributing this code in whole or in part
- Modifying and publishing this code as your own work
- Using this project or its core logic for any commercial purpose
- Creating derivative works based on this project for distribution
- Re-uploading or duplicating this project on any platform or repository
- Using any part of this codebase in another project without explicit written
  permission from the author

This software is provided "as is", without warranty of any kind, express or
implied. The author shall not be held liable for any damages arising from the
use of this software.

Unauthorized use, reproduction, or distribution of this software may result
in civil and criminal penalties and will be prosecuted to the maximum extent
possible under applicable law.

For licensing inquiries or permissions beyond the scope above, contact:
rominkevadiya@gmail.com
