import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.schemas import QueryRequest, QueryResponse, SourceChunk, UploadResponse
from app.db.vector_store import vector_store
from app.services.embedding_service import embed_chunks
from app.services.llm_service import generate_answer
from app.services.pdf_service import extract_and_chunk
from app.services.retrieval_service import retrieve

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        chunks = extract_and_chunk(tmp_path, filename=file.filename)
    finally:
        os.unlink(tmp_path)

    if not chunks:
        raise HTTPException(status_code=400, detail="No text found in the uploaded PDF.")

    texts = [c["text"] for c in chunks]
    embeddings = embed_chunks(texts)
    vector_store.add(chunks, embeddings)

    return UploadResponse(status="ok", chunks_stored=len(chunks))


@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    if vector_store.is_empty():
        raise HTTPException(status_code=400, detail="No documents uploaded yet.")

    top_chunks = retrieve(req.question)

    if not top_chunks:
        return QueryResponse(answer="No relevant information found.", sources=[])

    answer = generate_answer(req.question, top_chunks)

    sources = [
        SourceChunk(text=c["text"], source=c["source"], page=c["page"])
        for c in top_chunks
    ]

    return QueryResponse(answer=answer, sources=sources)