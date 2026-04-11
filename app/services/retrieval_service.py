from app.db.vector_store import vector_store
from app.services.embedding_service import embed_query
from app.core.config import TOP_K


def retrieve(question: str) -> list[dict]:
    q_embedding = embed_query(question)
    return vector_store.search(q_embedding, k=TOP_K)