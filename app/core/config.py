import os


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default

    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer, got {value!r}") from exc


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default

    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(f"{name} must be a float, got {value!r}") from exc


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

APP_TITLE = os.getenv("SIMHAS_APP_TITLE", "Simhas RAG Chatbot - Phase 2")
DATA_DIR = os.getenv("SIMHAS_DATA_DIR", os.path.join(BASE_DIR, "data"))
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss.index")
CHUNKS_PATH = os.path.join(DATA_DIR, "chunks.pkl")

EMBEDDING_MODEL = os.getenv("SIMHAS_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
OLLAMA_URL = os.getenv("SIMHAS_OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("SIMHAS_OLLAMA_MODEL", "tinyllama")

TOP_K = _env_int("SIMHAS_TOP_K", 3)
RETRIEVAL_CANDIDATE_K = _env_int("SIMHAS_RETRIEVAL_CANDIDATE_K", 12)
CHUNK_SIZE = _env_int("SIMHAS_CHUNK_SIZE", 150)
CHUNK_OVERLAP = _env_int("SIMHAS_CHUNK_OVERLAP", 50)
MIN_RELEVANCE_SCORE = _env_float("SIMHAS_MIN_RELEVANCE_SCORE", 0.2)
RERANK_LEXICAL_WEIGHT = _env_float("SIMHAS_RERANK_LEXICAL_WEIGHT", 0.2)