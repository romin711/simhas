import logging
import os
import tempfile
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.schemas import QueryMeta, QueryRequest, QueryResponse, SourceChunk, UploadResponse
from app.db.vector_store import vector_store
from app.services.embedding_service import embed_chunks
from app.services.llm_service import generate_answer
from app.services.pdf_service import extract_and_chunk
from app.services.retrieval_service import retrieve

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=UploadResponse)
def upload_pdf(file: UploadFile = File(...)):
    started_at = time.perf_counter()

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        try:
            chunks = extract_and_chunk(tmp_path, filename=file.filename)
        except RuntimeError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        os.unlink(tmp_path)

    if not chunks:
        raise HTTPException(status_code=400, detail="No text found in the uploaded PDF.")

    try:
        texts = [c["text"] for c in chunks]
        embeddings = embed_chunks(texts)
        vector_store.add(chunks, embeddings)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Embedding service unavailable.") from exc

    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info("Upload processed: file=%s chunks=%s elapsed_ms=%s", file.filename, len(chunks), elapsed_ms)

    return UploadResponse(status="ok", chunks_stored=len(chunks))


@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    if vector_store.is_empty():
        raise HTTPException(status_code=400, detail="No documents uploaded yet.")

    started_at = time.perf_counter()
    retrieval = retrieve(req.question)
    top_chunks = retrieval["chunks"]
    meta = QueryMeta(**retrieval["meta"])

    if not top_chunks:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        logger.info("Query returned no evidence: elapsed_ms=%s top_score=%.3f", elapsed_ms, meta.top_score)
        return QueryResponse(answer="No relevant information found.", sources=[], meta=meta)

    try:
        answer = generate_answer(req.question, top_chunks)
    except RuntimeError as exc:
        logger.exception("LLM generation failed")
        raise HTTPException(status_code=503, detail="LLM service unavailable.") from exc

    sources = [
        SourceChunk(text=c["text"], source=c["source"], page=c["page"])
        for c in top_chunks
    ]

    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info(
        "Query answered: elapsed_ms=%s used_chunks=%s top_score=%.3f weak_evidence=%s",
        elapsed_ms,
        meta.used_chunks,
        meta.top_score,
        meta.weak_evidence,
    )

    return QueryResponse(answer=answer, sources=sources, meta=meta)