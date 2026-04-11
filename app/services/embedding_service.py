import numpy as np
from sentence_transformers import SentenceTransformer
from app.core.config import EMBEDDING_MODEL

_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_chunks(texts: list[str]) -> np.ndarray:
    return _get_model().encode(texts, convert_to_numpy=True, show_progress_bar=False)


def embed_query(question: str) -> np.ndarray:
    return _get_model().encode([question], convert_to_numpy=True, show_progress_bar=False)[0]