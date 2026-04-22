import re

from app.db.vector_store import vector_store
from app.services.embedding_service import embed_query
from app.core.config import (
    MIN_RELEVANCE_SCORE,
    RERANK_LEXICAL_WEIGHT,
    RETRIEVAL_CANDIDATE_K,
    TOP_K,
)


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"\w+", text.lower()) if len(t) > 2}


def _lexical_overlap_score(question_terms: set[str], chunk_text: str) -> float:
    if not question_terms:
        return 0.0
    chunk_terms = _tokenize(chunk_text)
    if not chunk_terms:
        return 0.0
    return len(question_terms.intersection(chunk_terms)) / len(question_terms)


def _is_near_duplicate(candidate: dict, selected: list[dict]) -> bool:
    candidate_terms = _tokenize(candidate["text"])
    for existing in selected:
        # Avoid repeatedly returning the same page passage when overlap windows are very similar.
        if candidate["source"] == existing["source"] and candidate["page"] == existing["page"]:
            existing_terms = _tokenize(existing["text"])
            if not candidate_terms or not existing_terms:
                continue
            overlap = len(candidate_terms.intersection(existing_terms))
            smaller = min(len(candidate_terms), len(existing_terms))
            if smaller > 0 and (overlap / smaller) >= 0.85:
                return True
    return False


def _hybrid_rerank(question: str, scored_chunks: list[dict]) -> list[dict]:
    question_terms = _tokenize(question)
    lexical_weight = max(0.0, min(1.0, RERANK_LEXICAL_WEIGHT))
    semantic_weight = 1.0 - lexical_weight

    reranked = []
    for chunk in scored_chunks:
        lexical = _lexical_overlap_score(question_terms, chunk["text"])
        final_score = (semantic_weight * chunk["score"]) + (lexical_weight * lexical)
        reranked.append({**chunk, "rerank_score": final_score})

    reranked.sort(key=lambda c: c["rerank_score"], reverse=True)
    return reranked


def retrieve(question: str) -> dict:
    q_embedding = embed_query(question)
    candidate_k = max(TOP_K, RETRIEVAL_CANDIDATE_K)
    scored_chunks = vector_store.search_with_scores(q_embedding, k=candidate_k)

    if not scored_chunks:
        return {
            "chunks": [],
            "meta": {
                "top_score": 0.0,
                "min_relevance_score": MIN_RELEVANCE_SCORE,
                "used_chunks": 0,
                "retrieved_chunks": 0,
                "candidate_chunks": 0,
                "rerank_applied": False,
                "weak_evidence": True,
            },
        }

    top_score = max(c["score"] for c in scored_chunks)
    reranked_chunks = _hybrid_rerank(question, scored_chunks)
    thresholded_chunks = [c for c in reranked_chunks if c["score"] >= MIN_RELEVANCE_SCORE]

    passed_chunks = []
    for chunk in thresholded_chunks:
        if _is_near_duplicate(chunk, passed_chunks):
            continue
        passed_chunks.append(chunk)
        if len(passed_chunks) >= TOP_K:
            break

    chunks = [
        {"text": c["text"], "source": c["source"], "page": c["page"]}
        for c in passed_chunks
    ]

    return {
        "chunks": chunks,
        "meta": {
            "top_score": top_score,
            "min_relevance_score": MIN_RELEVANCE_SCORE,
            "used_chunks": len(chunks),
            "retrieved_chunks": len(thresholded_chunks),
            "candidate_chunks": len(scored_chunks),
            "rerank_applied": True,
            "weak_evidence": len(chunks) == 0,
        },
    }