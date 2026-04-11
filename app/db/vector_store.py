import pickle
import numpy as np
import faiss

from app.core.config import FAISS_INDEX_PATH, CHUNKS_PATH


class VectorStore:
    def __init__(self):
        self.index = None
        self.chunks: list[dict] = []  # Each: {"text": str, "source": str, "page": int}

    def is_empty(self) -> bool:
        return self.index is None or len(self.chunks) == 0

    def add(self, chunks: list[dict], embeddings: np.ndarray):
        dim = embeddings.shape[1]

        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)

        embeddings = embeddings.astype("float32")
        faiss.normalize_L2(embeddings)

        self.index.add(embeddings)
        self.chunks.extend(chunks)
        self.save()

    def search(self, query_embedding: np.ndarray, k: int = 3) -> list[dict]:
        if self.is_empty():
            return []

        k = min(k, len(self.chunks))
        query = query_embedding.astype("float32").reshape(1, -1)
        faiss.normalize_L2(query)

        _, indices = self.index.search(query, k)
        return [self.chunks[i] for i in indices[0] if i < len(self.chunks)]

    def save(self):
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(CHUNKS_PATH, "wb") as f:
            pickle.dump(self.chunks, f)

    def load(self):
        try:
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(CHUNKS_PATH, "rb") as f:
                self.chunks = pickle.load(f)
            print(f"[VectorStore] Loaded {len(self.chunks)} chunks from disk.")
        except FileNotFoundError:
            print("[VectorStore] No persisted data found. Starting fresh.")
        except Exception as e:
            print(f"[VectorStore] Failed to load: {e}. Starting fresh.")


vector_store = VectorStore()